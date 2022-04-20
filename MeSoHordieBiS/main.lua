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
            order = 0
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
            order = 10
        },
        modeDescription = {
            type = "description",
            name = MSHB:getSupportedModesDescription(),
            order = 11
        },
        showBiSIndicator = {
            type = "toggle",
            name = "Show BiS indicator",
            desc = "Adds checkmarks to your/inspected character window if that item is BiS for your character in the selected phase",
            get = "GetShowBiSIndicator",
            set = "SetShowBiSIndicator",
            order = 20,
            width = "full"
        },
        ignoreGuildCheck = {
            type = "toggle",
            name = "Ignore guild/realm check",
            desc = "Shows information for non-guildies",
            get = "GetIgnoreGuildCheck",
            set = "SetIgnoreGuildCheck",
            order = 30,
            width = "full"
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

function MeSoHordieAddon:GetIgnoreGuildCheck(info)
    return self.db.char.ignoreGuildCheck
end

function MeSoHordieAddon:SetIgnoreGuildCheck(info, value)
    self.db.char.ignoreGuildCheck = value
    self:RefreshCharacterFrame();
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
        self:SetCurrentMode(nil, mode)
        print("Mode changed to " .. mode .. " mode!")
        return
    end

    print("Invalid mode specified: " .. mode)
end

function MeSoHordieAddon:ToggleIndicatorCommand()
    self:SetShowBiSIndicator(nil, not self:GetShowBiSIndicator(nil))
    print("Indicator set to " .. (self:GetShowBiSIndicator(nil) and "shown" or "hidden"))
end

function MeSoHordieAddon:ToggleGuildCheckCommand()
    self:SetIgnoreGuildCheck(nil, not self:GetIgnoreGuildCheck(nil))
    print("Ignore guild check is set to " .. (self:GetIgnoreGuildCheck(nil) and "yes" or "no"))
end

function MeSoHordieAddon:PrintVersion()
    print("Addon version: " .. MeSoHordieAddon.addonVersion)
    print("Data version: " .. msh_bis_addon_data["version"])
end

function MeSoHordieAddon:ToggleExperimentalFeatures()
    self.db.char.showMultiPhaseIndicator = not self.db.char.showMultiPhaseIndicator
    print("Experimental mode changed")
end

function MeSoHordieAddon:dump(t, indent, done)
    done = done or {}
    indent = indent or 0

    done[t] = true

    for key, value in pairs(t) do
        if type(value) == "table" and not done[value] then
            done[value] = true
            print(string.rep(" ", indent) .. key, ":")

            self:dump(value, indent + 2, done)
            done[value] = nil
        else
            print(string.rep(" ", indent) .. key, " = ", value, "")
        end
    end
end

function MeSoHordieAddon:MSHBInputProcessorFunc(input)
    if input == "" then
        InterfaceOptionsFrame_OpenToCategory(self.optionsFrame)
        InterfaceOptionsFrame_OpenToCategory(self.optionsFrame)
        print("Me So Hordie BiS")
        print("Commands:")
        print("/mshb mode <mode>")
        print("/mshb phase <number>")
        print("/mshb indicator")
        print("/mshb ignoreguildcheck")
        print("/mshb version")
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
        self:ToggleIndicatorCommand()
    end

    if (split[1] == "ignoreguildcheck") then
        self:ToggleGuildCheckCommand()
    end

    if (split[1] == "version") then
        self:PrintVersion()
    end

    if (split[1] == "experimental") then
        self:ToggleExperimentalFeatures()
    end

    if (split[1] == "dev") then
        self:ShowBiSWindow();
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

function MeSoHordieAddon:OnAddonLoaded(event, addon)
    if self.lazyHooks[addon] then
        self.lazyHooks[addon]()
        self.lazyHooks[addon] = nil
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
    self:RegisterEvent("ADDON_LOADED", "OnAddonLoaded");

    LibStub("AceConfig-3.0"):RegisterOptionsTable("MeSoHordieAddon", self.options)
    self.optionsFrame = LibStub("AceConfigDialog-3.0"):AddToBlizOptions("MeSoHordieAddon", "MeSoHordieAddon")

    self.db = LibStub("AceDB-3.0"):New("MeSoHordieAddonDB", {
        char = {
            mode = 'spec',
            phase = MSHB:getCurrentPhase(),
            showBisIndicator = true,
            showMultiPhaseIndicator = false
        }
    })

    self.db.char.phase = MSHB:getCurrentPhase()

    if self.db.char.showBisIndicator == nil then
        self.db.char.showBisIndicator = true
    end

    if self.db.char.showMultiPhaseIndicator == nil then
        self.db.char.showMultiPhaseIndicator = false
    end

    self:RegisterChatCommand("mshb", "MSHBInputProcessorFunc")

    self:HookScript(GameTooltip, "OnTooltipSetItem", "UpdateTooltip")
    self:HookScript(ItemRefTooltip, "OnTooltipSetItem", "UpdateTooltip")
    self:SecureHook("PaperDollItemSlotButton_Update");
    self:LazyHook("Blizzard_InspectUI", function()
        self:SecureHook("InspectPaperDollItemSlotButton_Update");
    end)

    self:InitializeUI();
end

function MeSoHordieAddon:OnEnable()

end
