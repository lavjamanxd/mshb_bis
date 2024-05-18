function SBL:generateSelectFromTable(tab, fieldName)
    local gen = {}
    for k, v in pairs(tab) do
        gen[k] = v[fieldName]
    end
    return gen
end

SBL.supportedModes = {
    ["spec"] = {
        name = "Spec",
        description = "BiS item information based on your talent specialization"
    },
    ["class"] = {
        name = "Class",
        description = "BiS item information based on your class"
    },
    ["all"] = {
        name = "All",
        description = "BiS item information for all class/spec"
    }
}

function SBL:getSupportedModesDescription()
    local result = {}
    local n = 1
    for _, v in pairs(self.supportedModes) do
        result[n] = v["name"] .. " - " .. v["description"]
        n = n + 1
    end
    return table.concat(result, "\n")
end

SBL.supportedPhases = {
    [0] = {
        name = "Pre-Raid",
        start = time {
            year = 2024,
            month = 5,
            day = 20
        }
    },
    [1] = {
        name = "Phase 1 - BoT/TotF/BD",
        start = time {
            year = 2024,
            month = 5,
            day = 30
        }
    }
}

SBL.options = {
    name = "Simple BiS",
    handler = SBL,
    type = "group",
    args = {
        currentPhase = {
            type = "select",
            name = "Selected Phase",
            desc = "Change BiS data from specific phase",
            values = SBL:generateSelectFromTable(SBL.supportedPhases, "name"),
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
            values = SBL:generateSelectFromTable(SBL.supportedModes, "name"),
            get = "GetCurrentMode",
            set = "SetCurrentMode",
            style = "dropdown",
            width = "double",
            order = 10
        },
        modeDescription = {
            type = "description",
            name = SBL:getSupportedModesDescription(),
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
        showMinimapIcon = {
            type = "toggle",
            name = "Show minimap icon",
            desc = "Shows the minimap icon for the BiS Browser",
            get = "GetShowMinimapIcon",
            set = "SetShowMinimapIcon",
            order = 31,
            width = "full"
        }
    }
}

SBL.inventorySlots = { "head", "neck", "shoulders", "back", "chest", "wrists", "mainHand", "offHand", "hands", "belt",
    "legs", "feet", "ring", "trinket", "ranged" }

SBL.inventorySlotsLabels = {
    ["head"] = "Head",
    ["neck"] = "Necklace",
    ["shoulders"] = "Shoulders",
    ["back"] = "Back",
    ["chest"] = "Chest",
    ["wrists"] = "Wrists",
    ["mainHand"] = "Two-Hand / Main-Hand",
    ["offHand"] = "Off-hand",
    ["hands"] = "Hands",
    ["belt"] = "Waist",
    ["legs"] = "Legs",
    ["feet"] = "Feet",
    ["ring"] = "Rings",
    ["trinket"] = "Trinkets",
    ["ranged"] = "Ranged / Totem / Libram / Idol"
}

SBL.inventorySlotIdMap = {
    ["head"] = 1,
    ["neck"] = 2,
    ["shoulders"] = 3,
    ["back"] = 15,
    ["chest"] = 5,
    ["wrists"] = 9,
    ["mainHand"] = 16,
    ["offHand"] = 17,
    ["hands"] = 10,
    ["belt"] = 6,
    ["legs"] = 7,
    ["feet"] = 8,
    ["ring1"] = 11,
    ["ring2"] = 12,
    ["trinket1"] = 13,
    ["trinket2"] = 14,
    ["ranged"] = 18
}

SBL.spec_icon_table = {
    ["DRUID_balance"] = 'interface/icons/spell_nature_starfall.blp',
    ["DRUID_feral combat"] = 'interface/icons/ability_racial_bearform.blp',
    ["DRUID_feral combat_cat"] = 'interface/icons/ability_druid_catform.blp',
    ["DRUID_restoration"] = 'interface/icons/spell_nature_healingtouch.blp',
    ["HUNTER_beast mastery"] = 'interface/icons/ability_hunter_beasttaming.blp',
    ["HUNTER_marksmanship"] = 'interface/icons/ability_marksmanship.blp',
    ["HUNTER_survival"] = 'interface/icons/ability_hunter_swiftstrike.blp',
    ["MAGE_arcane"] = 'interface/icons/spell_holy_magicalsentry.blp',
    ["MAGE_fire"] = 'interface/icons/spell_fire_firebolt02.blp',
    ["MAGE_frost"] = 'interface/icons/spell_frost_frostbolt02.blp',
    ["PALADIN_protection"] = 'interface/icons/spell_holy_devotionaura.blp',
    ["PALADIN_retribution"] = 'interface/icons/spell_holy_auraoflight.blp',
    ["PALADIN_holy"] = 'interface/icons/spell_holy_holybolt.blp',
    ["PRIEST_shadow"] = 'interface/icons/spell_shadow_shadowwordpain.blp',
    ["PRIEST_holy"] = 'interface/icons/spell_holy_holybolt.blp',
    ["PRIEST_discipline"] = 'interface/icons/spell_holy_wordfortitude.blp',
    ["ROGUE_combat"] = 'interface/icons/ability_backstab.blp',
    ["ROGUE_assassination"] = 'interface/icons/ability_rogue_eviscerate.blp',
    ["ROGUE_subtlety"] = 'interface/icons/ability_stealth.blp',
    ["SHAMAN_elemental"] = 'interface/icons/spell_nature_lightning.blp',
    ["SHAMAN_enhancement"] = 'interface/icons/spell_nature_lightningshield.blp',
    ["SHAMAN_restoration"] = 'interface/icons/spell_nature_magicimmunity.blp',
    ["WARLOCK_affliction"] = 'interface/icons/spell_shadow_deathcoil.blp',
    ["WARLOCK_demonology"] = 'interface/icons/spell_shadow_metamorphosis.blp',
    ["WARLOCK_destruction"] = 'interface/icons/spell_shadow_rainoffire.blp',
    ["WARRIOR_protection"] = 'interface/icons/inv_shield_06.blp',
    ["WARRIOR_arms"] = 'interface/icons/ability_rogue_eviscerate.blp',
    ["WARRIOR_fury"] = 'interface/icons/ability_warrior_innerrage.blp',
    ["DEATHKNIGHT_blood"] = 'interface/icons/spell_deathknight_bloodpresence.blp',
    ["DEATHKNIGHT_frost"] = 'interface/icons/spell_deathknight_frostpresence.blp',
    ["DEATHKNIGHT_unholy"] = 'interface/icons/spell_deathknight_unholypresence.blp'
}

SBL.tooltipCache = {}

function SBL:RefreshCharacterFrame()
    ToggleCharacter("PaperDollFrame")
    ToggleCharacter("PaperDollFrame")
end

function SBL:GetShowMinimapIcon(info)
    return not self.db.profile.minimap.hide
end

function SBL:SetShowMinimapIcon(info, value)
    self.db.profile.minimap.hide = not value
    if value then
        self.icon:Show("SBLMM")
    else
        self.icon:Hide("SBLMM")
    end
end

function SBL:GetShowBiSIndicator(info)
    return self.db.char.showBisIndicator
end

function SBL:SetShowBiSIndicator(info, value)
    self.db.char.showBisIndicator = value
    self:RefreshCharacterFrame()
end

function SBL:GetCurrentPhase(info)
    return self.db.char.phase
end

function SBL:SetCurrentPhase(info, value)
    self.db.char.phase = value
    self:RefreshCharacterFrame()
end

function SBL:GetCurrentMode(info)
    return self.db.char.mode
end

function SBL:SetCurrentMode(info, value)
    self.db.char.mode = value
end

function SBL:ChangePhaseCommand(phase)
    if (phase == nil) then
        print("Supported phases: " .. SBL:pconcat(SBL.supportedPhases, ", "))
        return
    end

    local phaseNumber = tonumber(phase)
    local phaseSupported = SBL:has_key(SBL.supportedPhases, phaseNumber)

    if phaseSupported then
        self:SetCurrentPhase(nil, phaseNumber)
        print("Phase changed to " .. phase)
        return
    end

    print("Unsupported phase specified: " .. phase)
end

function SBL:ChangeModeCommand(mode)
    if (mode == nil) then
        print("Available modes: " .. SBL:pconcat(SBL.supportedModes, ", "))
        return
    end

    local modeSupported = SBL:has_key(SBL.supportedModes, mode)

    if modeSupported then
        self:SetCurrentMode(nil, mode)
        print("Mode changed to " .. mode .. " mode!")
        return
    end

    print("Invalid mode specified: " .. mode)
end

function SBL:ToggleIndicatorCommand()
    self:SetShowBiSIndicator(nil, not self:GetShowBiSIndicator(nil))
    print("Indicator set to " .. (self:GetShowBiSIndicator(nil) and "shown" or "hidden"))
end

function SBL:PrintVersion()
    print("Addon version: " .. SBL.addonVersion)
    print("Data version: " .. sbl_bis_addon_data["version"])
end



function SBL:dump(t, indent, done)
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

function SBL:SBLInputProcessorFunc(input)
    if input == "" then
        InterfaceOptionsFrame_OpenToCategory(self.optionsFrame)
        InterfaceOptionsFrame_OpenToCategory(self.optionsFrame)
        print("Simple BiS")
        print("Commands:")
        print("/sbl mode <mode>")
        print("/sbl phase <number>")
        print("/sbl indicator")
        print("/sbl browser")
        print("/sbl version")
        return
    end

    local split = self:string_split(input, " ")

    if (split[1] == "mode") then
        self:ChangeModeCommand(split[2])
    end

    if (split[1] == "phase") then
        self:ChangePhaseCommand(split[2])
    end

    if (split[1] == "indicator") then
        self:ToggleIndicatorCommand()
    end

    if (split[1] == "version") then
        self:PrintVersion()
    end

    if (split[1] == "browser") then
        self:ShowBiSWindow()
    end
end

function SBL:PaperDollItemSlotButton_Update(button)
    self:UpdateButton(button, "player")
end

function SBL:InspectPaperDollItemSlotButton_Update(button)
    self:UpdateButton(button, "target")
end

function SBL:UpdateTooltip(frame)
    self:append_tooltip(frame, false)
end

function SBL:OnAddonLoaded(event, addon)
    if self.lazyHooks[addon] then
        self.lazyHooks[addon]()
        self.lazyHooks[addon] = nil
    end
end

function SBL:LazyHook(addon, hookFunc)
    if IsAddOnLoaded(addon) then
        hookFunc()
    else
        self.lazyHooks[addon] = hookFunc
    end
end

function SBL:OnInitialize()
    self:RegisterEvent("ADDON_LOADED", "OnAddonLoaded")

    LibStub("AceConfig-3.0"):RegisterOptionsTable("SBL", self.options)
    self.optionsFrame = LibStub("AceConfigDialog-3.0"):AddToBlizOptions("SBL", "SBL")
    self.icon = LibStub("LibDBIcon-1.0")
    local sblmmLDB = LibStub("LibDataBroker-1.1"):NewDataObject("SBLMM", {
        type = "data source",
        text = "Simple BiS Browser",
        icon = "Interface\\Icons\\INV_Chest_Cloth_17",
        OnClick = function() self:ShowBiSWindow() end,
        })

    self.db = LibStub("AceDB-3.0"):New("SBLDB", {
        char = {
            mode = 'spec',
            phase = self:calculateCurrentPhase(),
            showBisIndicator = true,
            missingOnlyEnabled = false,
        } ,
        profile = {
            minimap = {
                hide = false
            }
        }
    })

    self.icon:Register("SimpleBiSMM", sblmmLDB, self.db.profile.minimap)

    if not SBL:has_key(SBL.supportedPhases, self:GetCurrentPhase()) then
        self.db.char.phase = self:calculateCurrentPhase()
    end

    if self.db.char.showBisIndicator == nil then
        self.db.char.showBisIndicator = true
    end

    self:RegisterChatCommand("sbl", "SBLInputProcessorFunc")

    self:HookScript(GameTooltip, "OnTooltipSetItem", "UpdateTooltip")
    self:HookScript(ItemRefTooltip, "OnTooltipSetItem", "UpdateTooltip")
    self:SecureHook("PaperDollItemSlotButton_Update")
    self:LazyHook("Blizzard_InspectUI", function()
        self:SecureHook("InspectPaperDollItemSlotButton_Update")
    end)

    self:InitializeUI()
end

function SBL:OnEnable()

end

function SBL:calculateCurrentPhase()
    local phaseResult = 0
    local now = time()
    for _, v in pairs(self.supportedPhases) do
        if v["start"] < now then
            phaseResult = phaseResult + 1
        end
    end
    return phaseResult
end

function SBL:pconcat(tab, joinChar)
    local ctab = {}
    local n = 1
    for k, v in pairs(tab) do
        ctab[n] = k
        n = n + 1
    end
    return table.concat(ctab, joinChar)
end

function SBL:to_pascal_case(input)
    local result = input:sub(1, 1):upper() .. input:sub(2):lower()
    return result
end

function SBL:predict_player(target, inspect)
    local _, englishClass, classIndex = UnitClass(target)
    local predictedSpec = ""
    local predictedSpecSpentPoints = -1
    for i = 1, GetNumTalentTabs(inspect) do
        local activeSpec = GetActiveTalentGroup(inspect)
        local _, name, _, texture, pointsSpent, fileName = GetTalentTabInfo(i, inspect, false, activeSpec)
        if predictedSpecSpentPoints < pointsSpent then
            predictedSpec = name
            predictedSpecSpentPoints = pointsSpent
        end
    end
    return englishClass, predictedSpec
end

function SBL:player_is_master_looter()
    local lootmethod, masterlooterPartyID, masterlooterRaidID = GetLootMethod()
    if lootmethod == "master" and (masterlooterPartyID == 0 or masterlooterRaidID == 0) then
        return true
    end

    return false
end

function SBL:get_extra_from_group(itemId, class, spec, role, nth, group)
    if group == nil then
        return ""
    end

    if self:has_value_nested(group, "34664") and itemId ~= group[1][1] then
        return " |Tinterface/icons/spell_nature_elementalshields.blp:0|t"
    end

    return ""
end

function SBL:append_spec(tooltip, itemId, class, spec, role, nth, group, slotID)
    local classIcon = "classicon_" .. class .. ".blp"
    local specIcon = self.spec_icon_table[class .. '_' .. spec:lower()]

    if class == "DEATHKNIGHT" then
        classIcon = "spell_deathknight_classicon.blp"
    end

    if class == "DRUID" and spec == "feral combat" and role == "DPS" then
        specIcon = self.spec_icon_table[class .. '_' .. spec:lower() .. "_cat"]
    end

    local prefix = tostring(nth) .. ". ";

    if spec == "all" then
        tooltip:AddLine(prefix .. "|Tinterface/icons/" .. classIcon .. ":0|t " ..
            "|Tinterface/icons/" .. classIcon .. ":0|t " .. self:to_pascal_case(class) .. " - " ..
            self:to_pascal_case(spec) .. " - " .. role ..
            self:get_extra_from_group(itemId, class, spec, role, nth, group))
        return
    end

    tooltip:AddLine(prefix .. "|Tinterface/icons/" .. classIcon .. ":0|t " .. "|T" .. specIcon ..
        ":0|t " .. self:to_pascal_case(class) .. " - " .. self:to_pascal_case(spec) .. " - " .. role ..
        self:get_extra_from_group(itemId, class, spec, role, nth, group))
end

function SBL:has_key(tab, val)
    for index, value in pairs(tab) do
        if index == val then
            return true
        end
    end

    return false
end

function SBL:has_value(tab, val)
    for index, value in ipairs(tab) do
        if value == val then
            return true
        end
    end

    return false
end

function SBL:has_value_nested(tab, val)
    for index, value in pairs(tab) do
        if (type(value) == "table") then
            local result = self:has_value_nested(value, val)
            if result then
                return true
            end
        else
            if value == val then
                return true
            end
        end
    end

    return nil
end

function SBL:get_table_which_contains(tab, val)
    for index, value in pairs(tab) do
        if (type(value) == "table") then
            local result = self:has_value_nested(value, val)
            if result then
                return value
            end
        else
            if value == val then
                return true
            end
        end
    end

    return false
end

function SBL:get_tables_which_contains(tab, val)
    local result = {}
    for index, value in pairs(tab) do
        if (type(value) == "table") then
            local hasValue = self:has_value_nested(value, val)
            if hasValue then
                table.insert(result, value)
            end
        end
    end

    return result
end

function SBL:indexOf(tab, val)
    local counter = 1
    for index, value in pairs(tab) do
        for _, g in ipairs(value) do
            if g == val then
                return counter
            end
        end
        counter = counter + 1;
    end

    return false
end

function SBL:getIndexOfFromMultipleGroups(groups, itemId)
    local group
    local bisSlots = self:get_tables_which_contains(groups, itemId)
    local betterIndex = 1000
    for z, o in ipairs(bisSlots) do
        local index = self:indexOf(o, itemId)
        if index and index < betterIndex then
            betterIndex = index
            group = o
        end
    end
    return betterIndex, group
end

function SBL:append_tooltip(tooltip, forcedAllMode)
    local _, itemLink = tooltip:GetItem()

    if itemLink == nil then
        return
    end

    local itemId = select(3, strfind(itemLink, "item:(%d+)"))

    if itemId == nil then
        return
    end

    local class, spec = self:predict_player("player", false)
    local currentPhaseBiSClass = sbl_bis_addon_data["phases"]["phase" .. SBL.db.char.phase][class:lower()]
    local isPlayerLootMaster = self:player_is_master_looter()
    local currentMode = ""

    local lines = {}

    local cacheKey = itemId .. SBL.db.char.mode .. SBL.db.char.phase .. class .. spec ..
        tostring(isPlayerLootMaster) .. tostring(forcedAllMode)

    if (SBL.tooltipCache.key and SBL.tooltipCache.key == cacheKey) then
        lines = SBL.tooltipCache.result
        currentMode = SBL.tooltipCache.mode
    else
        local itemEquipLocation = select(4, GetItemInfoInstant(itemId));

        if itemEquipLocation ~= "" then
            if SBL.db.char.mode == "spec" and not isPlayerLootMaster and not forcedAllMode then
                currentMode = "(" .. self.supportedModes[SBL.db.char.mode]["name"] .. " mode)"
                for _, bisClass in ipairs(currentPhaseBiSClass) do
                    if bisClass["spec"] == spec:lower() or bisClass["spec"]:lower() == "all" then
                        local index, group = self:getIndexOfFromMultipleGroups(bisClass["items"], itemId)
                        if group then
                            lines[#lines + 1] = { class, bisClass["spec"], bisClass["role"], index, group,
                                itemEquipLocation }
                        end
                    end
                end
            end

            if SBL.db.char.mode == "class" and not isPlayerLootMaster and not forcedAllMode then
                currentMode = "(" .. self.supportedModes[SBL.db.char.mode]["name"] .. " mode)"
                for index, bisClass in ipairs(currentPhaseBiSClass) do
                    local index, group = self:getIndexOfFromMultipleGroups(bisClass["items"], itemId)
                    if group then
                        lines[#lines + 1] = { class, bisClass["spec"], bisClass["role"], index, group, itemEquipLocation }
                    end
                end
            end

            if SBL.db.char.mode == "all" or isPlayerLootMaster or forcedAllMode then
                currentMode = "(" .. self.supportedModes["all"]["name"] .. " mode)"
                for i, c in pairs(sbl_bis_addon_data["phases"]["phase" .. SBL.db.char.phase]) do
                    for _, s in ipairs(c) do
                        local index, group = self:getIndexOfFromMultipleGroups(s["items"], itemId)
                        if group then
                            lines[#lines + 1] = { i:upper(), s["spec"], s["role"], index, group, itemEquipLocation }
                        end
                    end
                end
            end
        end


        SBL.tooltipCache.key = cacheKey
        table.sort(lines, function(k1, k2)
            return k1[4] < k2[4]
        end)
        SBL.tooltipCache.result = lines
        SBL.tooltipCache.mode = currentMode
    end

    if next(lines) ~= nil then
        local phase = "Pre-Raid"
        if SBL.db.char.phase > 0 then
            phase = "Phase " .. SBL.db.char.phase;
        end
        tooltip:AddLine("Simple BiS - " .. phase .. " " .. currentMode)
        for i, v in ipairs(lines) do
            self:append_spec(tooltip, itemId, v[1], v[2], v[3], v[4], v[5], v[6])
        end
    end
end

function SBL:string_split(s, delimiter)
    local result = {}
    for match in (s .. delimiter):gmatch("(.-)" .. delimiter) do
        table.insert(result, match)
    end
    return result
end

function SBL:UpdateButton(button, target)
    if button.sblIndicator then
        button.sblIndicator:Hide()
    end

    if not SBL.db.char.showBisIndicator then
        return
    end

    local slotID = button:GetID()

    self:AddIndicatorToButtonIfNeeded(button)

    if (slotID >= INVSLOT_FIRST_EQUIPPED and slotID <= INVSLOT_LAST_EQUIPPED and slotID ~= 4 and slotID ~= 19) then
        if target == "player" then
            local item = Item:CreateFromEquipmentSlot(slotID)
            if item:IsItemEmpty() then
                return
            end
            return item:ContinueOnItemLoad(function()
                local id = item:GetItemID()
                if id then
                    self:ShowIndicatorIfBiS(slotID, button, id, "player", false)
                end
            end)
        else
            local itemId = GetInventoryItemID(target, slotID)
            if itemId then
                self:ShowIndicatorIfBiS(slotID, button, itemId, "target", true)
                return button.sblIndicator
            end
        end
    end

    return button.sblIndicator and button.sblIndicator:Hide()
end

function SBL:AddIndicatorToButtonIfNeeded(button)
    if button.sblIndicator then
        return
    end
    local overlayFrame = CreateFrame("FRAME", nil, button)
    overlayFrame:SetFrameLevel(4)
    overlayFrame:SetAllPoints()
    button.sblIndicator = overlayFrame:CreateTexture(nil, "OVERLAY")
    button.sblIndicator:SetSize(14, 14)
    button.sblIndicator:SetPoint('TOPRIGHT', 4, 0)
    button.sblIndicator:Hide()
end

function SBL:ShowIndicatorIfBiS(slotID, button, itemId, unit, inspect)
    local class, spec = self:predict_player(unit, inspect)
    local bisClass = sbl_bis_addon_data["phases"]["phase" .. SBL.db.char.phase][class:lower()]

    if not bisClass then
        return
    end

    for _, v in ipairs(bisClass) do
        if v["spec"] == spec:lower() or v["spec"]:lower() == "all" then
            local index, group = self:getIndexOfFromMultipleGroups(v["items"], tostring(itemId))
            if group then
                if index == 1 or (index == 2 and (slotID == 11 or slotID == 12 or slotID == 13 or slotID == 14)) then
                    button.sblIndicator:SetAtlas("worldquest-tracker-checkmark")
                else
                    button.sblIndicator:SetAtlas("poi-door-arrow-up")
                end
            else
                button.sblIndicator:SetAtlas("Objective-Fail")
            end

            button.sblIndicator:Show()
        end
    end
end

function SBL:modifyHyperLink(hyperLink, mods)
    local splitLink = self:string_split(hyperLink, "|")
    local splitItemLink = self:string_split(splitLink[2], ":")

    for mod, value in ipairs(mods) do

    end

    splitLink[2] = table.concat(splitItemLink, ":")
    return table.concat(splitLink, "\124");
end
