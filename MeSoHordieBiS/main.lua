MeSoHordieAddon = LibStub("AceAddon-3.0"):NewAddon("MyAddon", "AceConsole-3.0", "AceHook-3.0", "AceEvent-3.0")

MeSoHordieAddon.lazyHooks = {}

MeSoHordieAddon.options = {
    name = "Me So Hordie BiS",
    handler = MeSoHordieAddon,
    type = "group",
    args = {
        currentPhase = {
            type = "select",
            name = "Selected Phase",
            desc = "Change BiS data from specific phase",
            values = MSHB:generateSelectFromTable(MSHB.supportedPhases, "name"),
            get = "GetCurrentPhase",
            set = "SetCurrentPhase",
            style = "dropdown",
            width = "double",
            order = 0,
        },
        mode = {
            type = "select",
            name = "Selected Mode",
            desc = "Sets which items are getting shown on item tooltips",
            values = MSHB:generateSelectFromTable(MSHB.supportedModes, "name"),
            get = "GetCurrentMode",
            set = "SetCurrentMode",
            style = "dropdown",
            width = "double",
            order = 10,
        },
        modeDescription ={
            type = "description",
            name = MSHB:getSupportedModesDescription(),
            order = 11,
        },
        showBiSIndicator = {
            type = "toggle",
            name = "Show BiS indicator",
            desc = "Adds checkmarks to your/inspected character window if that item is BiS for your character in the selected phase",
            get = "GetShowBiSIndicator",
            set = "SetShowBiSIndicator",
            order = 20,
            width = "full",
        }
    }
}

function MeSoHordieAddon:RefreshCharacterFrame()
    ToggleCharacter("PaperDollFrame")
    ToggleCharacter("PaperDollFrame")
end

function MeSoHordieAddon:GetShowBiSIndicator(info)
    return self.db.char.showBisIndicator
end

function MeSoHordieAddon:SetShowBiSIndicator(info, value)
    self.db.char.showBisIndicator = value
    self:RefreshCharacterFrame();
end

function MeSoHordieAddon:GetCurrentPhase(info)
    return self.db.char.phase
end

function MeSoHordieAddon:SetCurrentPhase(info, value)
    self.db.char.phase = value
    self:RefreshCharacterFrame();
end

function MeSoHordieAddon:GetCurrentMode(info)
    return self.db.char.mode
end

function MeSoHordieAddon:SetCurrentMode(info, value)
    self.db.char.mode = value
end

function MeSoHordieAddon:ChangePhaseCommand(phase)
    if (phase == nil) then
        print("Supported phases: " .. MSHB:pconcat(MSHB.supportedPhases, ", "))
        return
    end

    local phaseNumber = tonumber(phase)
    local phaseSupported = MSHB:has_key(MSHB.supportedPhases, phaseNumber);

    if phaseSupported then
        self:SetCurrentPhase(nil, phaseNumber)
        print("Phase changed to " .. phase)
        return
    end

    print("Unsupported phase specified: " .. phase)
end

function MeSoHordieAddon:ChangeModeCommand(mode)
    if (mode == nil) then
        print("Available modes: " .. MSHB:pconcat(MSHB.supportedModes, ", "))
        return
    end

    local modeSupported = MSHB:has_key(MSHB.supportedModes, mode)

    if modeSupported then
        self:SetCurrentMode(nil, modeSupported)
        print("Mode changed to " .. mode .. " mode!")
        return
    end

    print("Invalid mode specified: " .. mode)
end

function MeSoHordieAddon:MSHBInputProcessorFunc(input)
    if input == "" then
        InterfaceOptionsFrame_OpenToCategory(self.optionsFrame)
        InterfaceOptionsFrame_OpenToCategory(self.optionsFrame)
        print("Me So Hordie BiS (data: " .. msh_bis_addon_data["version"] .. ")")
        print("Commands:")
        print("/mshb mode <mode>")
        print("/mshb phase <number>")
        print("/mshb indicator")
        return
    end

    local split = MSHB:string_split(input, " ")

    if (split[1] == "mode") then
        self:ChangeModeCommand(split[2])
    end

    if (split[1] == "phase") then
        self:ChangePhaseCommand(split[2])
    end

    if (split[1] == "indicator") then
        self:SetShowBiSIndicator(nil, not self:GetShowBiSIndicator(nil))
        print("Indicator set to ".. (self:GetShowBiSIndicator(nil) and "shown" or "hidden"))
    end
end

function MeSoHordieAddon:PaperDollItemSlotButton_Update(button)
    MSHB:UpdateButton(button, "player")
end

function MeSoHordieAddon:InspectPaperDollItemSlotButton_Update(button)
    MSHB:UpdateButton(button, "target")
end

function MeSoHordieAddon:UpdateTooltip(frame)
    MSHB:append_tooltip(frame)
end

function MeSoHordieAddon:OnAddonLoaded(event, param)
    if self.lazyHooks[addon] then
        self.lazyHookshooks[addon]()
        self.lazyHookshooks[addon] = nil
    end
end

function MeSoHordieAddon:LazyHook(addon, hookFunc)
    if IsAddOnLoaded(addon) then
        hookFunc()
    else
        self.lazyHooks[addon] = hookFunc
    end
end

function MeSoHordieAddon:OnInitialize()
    LibStub("AceConfig-3.0"):RegisterOptionsTable("MeSoHordieAddon", self.options)
    self.optionsFrame = LibStub("AceConfigDialog-3.0"):AddToBlizOptions("MeSoHordieAddon", "MeSoHordieAddon")

    self.db = LibStub("AceDB-3.0"):New("MeSoHordieAddonDB", {
        char = {
            mode = 'spec',
            phase = MSHB:getCurrentPhase(),
            showBisIndicator = true
        }
    })

    self.db.char.phase = MSHB:getCurrentPhase()

    if self.db.char.showBisIndicator == nil then
        self.db.char.showBisIndicator = true
    end

    self:RegisterEvent("ADDON_LOADED", "OnAddonLoaded");
    self:RegisterChatCommand("mshb", "MSHBInputProcessorFunc")

    self:HookScript(GameTooltip, "OnTooltipSetItem", "UpdateTooltip")
    self:HookScript(ItemRefTooltip, "OnTooltipSetItem", "UpdateTooltip")
    self:SecureHook("PaperDollItemSlotButton_Update");
    self:LazyHook("Blizzard_InspectUI", function()
        self:SecureHook("InspectPaperDollItemSlotButton_Update");
    end)

end

function MeSoHordieAddon:OnEnable()

end
