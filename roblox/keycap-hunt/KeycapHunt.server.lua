-- Keycap Hunt
-- Step on the keycaps on the floor to find the hidden golden keycap.
-- Put this Script in ServerScriptService. It builds the whole level when the game starts.

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")

local CONFIG = {
	Rows = 6,
	Columns = 6,
	CapSize = 5, -- studs across each keycap
	Gap = 0.75, -- studs between keycaps
	PressDepth = 0.4, -- how far a keycap sinks when stepped on
	HotColdHints = true, -- pressed keycaps glow warmer the closer they are to the golden one
	ResetDelay = 6, -- seconds before a new round starts
	Origin = Vector3.new(0, 1, 0), -- centre of the floor's top surface
}

local LETTERS = "QWERTYUIOPASDFGHJKLZXCVBNM1234567890"

local CAP_COLOR = Color3.fromRGB(235, 235, 240)
local CAP_SIDE_COLOR = Color3.fromRGB(185, 185, 195)
local TEXT_COLOR = Color3.fromRGB(60, 60, 70)
local FLOOR_COLOR = Color3.fromRGB(40, 42, 54)
local COLD_COLOR = Color3.fromRGB(80, 140, 255)
local HOT_COLOR = Color3.fromRGB(255, 110, 40)
local PLAIN_PRESSED_COLOR = Color3.fromRGB(150, 150, 160)
local GOLD_COLOR = Color3.fromRGB(255, 200, 40)

local BODY_HEIGHT = 0.7
local TOP_HEIGHT = 0.3

local caps = {}
local golden = nil
local roundActive = false
local pressedCount = 0
local statusLabel = nil

local gridWidth = CONFIG.Columns * CONFIG.CapSize + (CONFIG.Columns - 1) * CONFIG.Gap
local gridDepth = CONFIG.Rows * CONFIG.CapSize + (CONFIG.Rows - 1) * CONFIG.Gap

local levelFolder = Instance.new("Folder")
levelFolder.Name = "KeycapHunt"
levelFolder.Parent = workspace

local function makePart(name, size, position, color, parent)
	local part = Instance.new("Part")
	part.Name = name
	part.Anchored = true
	part.Size = size
	part.Position = position
	part.Color = color
	part.Material = Enum.Material.SmoothPlastic
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	part.Parent = parent
	return part
end

local function buildFloorAndSpawn()
	local floor = makePart(
		"Floor",
		Vector3.new(gridWidth + 20, 1, gridDepth + 40),
		CONFIG.Origin - Vector3.new(0, 0.5, 0),
		FLOOR_COLOR,
		levelFolder
	)
	floor.Material = Enum.Material.Slate

	local spawn = Instance.new("SpawnLocation")
	spawn.Name = "Spawn"
	spawn.Anchored = true
	spawn.Size = Vector3.new(8, 1, 8)
	spawn.Position = CONFIG.Origin + Vector3.new(0, 0.5, -(gridDepth / 2 + 10))
	spawn.Color = Color3.fromRGB(90, 200, 120)
	spawn.Material = Enum.Material.SmoothPlastic
	spawn.TopSurface = Enum.SurfaceType.Smooth
	spawn.Duration = 0
	spawn.Parent = levelFolder
end

local function buildSign()
	local sign = makePart(
		"Sign",
		Vector3.new(24, 8, 0.5),
		CONFIG.Origin + Vector3.new(0, 7, gridDepth / 2 + 6),
		Color3.fromRGB(25, 25, 35),
		levelFolder
	)

	-- The Front face points toward -Z, which is where players spawn.
	local gui = Instance.new("SurfaceGui")
	gui.Face = Enum.NormalId.Front
	gui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	gui.PixelsPerStud = 40
	gui.Parent = sign

	local title = Instance.new("TextLabel")
	title.Size = UDim2.fromScale(1, 0.45)
	title.BackgroundTransparency = 1
	title.Font = Enum.Font.GothamBlack
	title.TextScaled = true
	title.TextColor3 = GOLD_COLOR
	title.Text = "KEYCAP HUNT"
	title.Parent = gui

	statusLabel = Instance.new("TextLabel")
	statusLabel.Position = UDim2.fromScale(0.05, 0.5)
	statusLabel.Size = UDim2.fromScale(0.9, 0.4)
	statusLabel.BackgroundTransparency = 1
	statusLabel.Font = Enum.Font.GothamBold
	statusLabel.TextScaled = true
	statusLabel.TextColor3 = Color3.new(1, 1, 1)
	statusLabel.Parent = gui
end

local function setStatus(text)
	if statusLabel then
		statusLabel.Text = text
	end
end

local function updateProgress()
	setStatus(string.format("Find the golden keycap!  Pressed %d / %d", pressedCount, #caps))
end

local function makeCap(row, col, letter)
	local model = Instance.new("Model")
	model.Name = string.format("Keycap_%d_%d", row, col)
	model.Parent = levelFolder

	local x = CONFIG.Origin.X - gridWidth / 2 + CONFIG.CapSize / 2 + (col - 1) * (CONFIG.CapSize + CONFIG.Gap)
	local z = CONFIG.Origin.Z - gridDepth / 2 + CONFIG.CapSize / 2 + (row - 1) * (CONFIG.CapSize + CONFIG.Gap)
	local y = CONFIG.Origin.Y

	local body = makePart(
		"Body",
		Vector3.new(CONFIG.CapSize, BODY_HEIGHT, CONFIG.CapSize),
		Vector3.new(x, y + BODY_HEIGHT / 2, z),
		CAP_SIDE_COLOR,
		model
	)

	local inset = CONFIG.CapSize * 0.15
	local top = makePart(
		"Top",
		Vector3.new(CONFIG.CapSize - inset, TOP_HEIGHT, CONFIG.CapSize - inset),
		Vector3.new(x, y + BODY_HEIGHT + TOP_HEIGHT / 2, z),
		CAP_COLOR,
		model
	)

	local gui = Instance.new("SurfaceGui")
	gui.Face = Enum.NormalId.Top
	gui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	gui.PixelsPerStud = 50
	gui.Parent = top

	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.GothamBold
	label.TextScaled = true
	label.TextColor3 = TEXT_COLOR
	label.Text = letter
	label.Parent = gui

	return {
		row = row,
		col = col,
		body = body,
		top = top,
		label = label,
		bodyCFrame = body.CFrame,
		topCFrame = top.CFrame,
		pressed = false,
	}
end

local function hintColor(cap)
	local distance = math.abs(cap.row - golden.row) + math.abs(cap.col - golden.col)
	local maxDistance = (CONFIG.Rows - 1) + (CONFIG.Columns - 1)
	return HOT_COLOR:Lerp(COLD_COLOR, distance / maxDistance)
end

local function sink(cap)
	local info = TweenInfo.new(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
	local offset = CFrame.new(0, -CONFIG.PressDepth, 0)
	TweenService:Create(cap.body, info, { CFrame = cap.bodyCFrame * offset }):Play()
	TweenService:Create(cap.top, info, { CFrame = cap.topCFrame * offset }):Play()
end

local function revealGolden(cap)
	cap.top.Color = GOLD_COLOR
	cap.top.Material = Enum.Material.Neon
	cap.body.Color = GOLD_COLOR
	cap.label.TextColor3 = Color3.fromRGB(120, 80, 0)

	local sparkles = Instance.new("Sparkles")
	sparkles.Name = "GoldFX"
	sparkles.SparkleColor = GOLD_COLOR
	sparkles.Parent = cap.top

	local light = Instance.new("PointLight")
	light.Name = "GoldFX"
	light.Color = GOLD_COLOR
	light.Brightness = 3
	light.Range = 16
	light.Parent = cap.top
end

local function awardWin(player)
	local stats = player:FindFirstChild("leaderstats")
	local wins = stats and stats:FindFirstChild("Golden Keys")
	if wins then
		wins.Value = wins.Value + 1
	end
end

local startRound

local function press(cap, player)
	if not roundActive or cap.pressed then
		return
	end
	cap.pressed = true
	pressedCount = pressedCount + 1
	sink(cap)

	if cap == golden then
		roundActive = false
		revealGolden(cap)
		awardWin(player)
		setStatus(string.format("%s found the golden keycap! New round in %ds...", player.DisplayName, CONFIG.ResetDelay))
		task.delay(CONFIG.ResetDelay, startRound)
	else
		cap.top.Color = CONFIG.HotColdHints and hintColor(cap) or PLAIN_PRESSED_COLOR
		updateProgress()
	end
end

startRound = function()
	for _, cap in ipairs(caps) do
		cap.pressed = false
		cap.body.CFrame = cap.bodyCFrame
		cap.top.CFrame = cap.topCFrame
		cap.body.Color = CAP_SIDE_COLOR
		cap.top.Color = CAP_COLOR
		cap.top.Material = Enum.Material.SmoothPlastic
		cap.label.TextColor3 = TEXT_COLOR
		for _, child in ipairs(cap.top:GetChildren()) do
			if child.Name == "GoldFX" then
				child:Destroy()
			end
		end
	end

	golden = caps[math.random(1, #caps)]
	pressedCount = 0
	roundActive = true
	updateProgress()
end

local function onTouched(cap, hit)
	local character = hit:FindFirstAncestorOfClass("Model")
	if not character then
		return
	end
	local player = Players:GetPlayerFromCharacter(character)
	if not player then
		return
	end
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if not humanoid or humanoid.Health <= 0 then
		return
	end
	press(cap, player)
end

local function onPlayerAdded(player)
	local stats = Instance.new("Folder")
	stats.Name = "leaderstats"
	stats.Parent = player

	local wins = Instance.new("IntValue")
	wins.Name = "Golden Keys"
	wins.Value = 0
	wins.Parent = stats
end

-- Build the level
buildFloorAndSpawn()
buildSign()

local index = 0
for row = 1, CONFIG.Rows do
	for col = 1, CONFIG.Columns do
		index = index + 1
		local letterIndex = (index - 1) % #LETTERS + 1
		local cap = makeCap(row, col, string.sub(LETTERS, letterIndex, letterIndex))
		table.insert(caps, cap)
		cap.body.Touched:Connect(function(hit)
			onTouched(cap, hit)
		end)
		cap.top.Touched:Connect(function(hit)
			onTouched(cap, hit)
		end)
	end
end

Players.PlayerAdded:Connect(onPlayerAdded)
for _, player in ipairs(Players:GetPlayers()) do
	onPlayerAdded(player)
end

startRound()
