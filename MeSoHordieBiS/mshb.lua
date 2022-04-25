MSHB = {}

MSHB.supportedPhases = {
    [1] = {
        name = "Phase 1 - KARA/G/M",
        start = time {
            year = 2021,
            month = 6,
            day = 1
        }
    },
    [2] = {
        name = "Phase 2 - SSC/TK",
        start = time {
            year = 2021,
            month = 9,
            day = 15
        }
    },
    [3] = {
        name = "Phase 3 - MH/BT",
        start = time {
            year = 2022,
            month = 1,
            day = 28
        }
    },
    [4] = {
        name = "Phase 4 - ZA",
        start = time {
            year = 2022,
            month = 3,
            day = 22
        }
    },
    [5] = {
        name = "Phase 5 - SW",
        start = time {
            year = 2022,
            month = 12,
            day = 31
        }
    }
}

MSHB.inventorySlots = {"head", "neck", "shoulders", "back", "chest", "wrists", "twoHand", "mainHand", "offHand",
                       "hands", "belt", "legs", "feet", "ring1", "ring2", "trinket1", "trinket2", "ranged"}

MSHB.inventorySlotsLabels = {
    ["head"] = "Head",
    ["neck"] = "Necklace",
    ["shoulders"] = "Shoulders",
    ["back"] = "Back",
    ["chest"] = "Chest",
    ["wrists"] = "Wrists",
    ["twoHand"] = "Two-hand",
    ["mainHand"] = "Main-hand",
    ["offHand"] = "Off-hand",
    ["hands"] = "Hands",
    ["belt"] = "Waist",
    ["legs"] = "Legs",
    ["feet"] = "Feet",
    ["ring1"] = "Ring 1",
    ["ring2"] = "Ring 2",
    ["trinket1"] = "Trinket 1",
    ["trinket2"] = "Trinket 2",
    ["ranged"] = "Ranged/Totem/Libram/Idol"
}

MSHB.supportedModes = {
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

MSHB.spec_icon_table = {
    ["DRUID_balance"] = 'interface/icons/spell_nature_starfall.blp',
    ["DRUID_feral combat"] = 'interface/icons/ability_racial_bearform.blp',
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
    ["ROGUE_assasination"] = 'interface/icons/ability_rogue_eviscerate.blp',
    ["ROGUE_subtlety"] = 'interface/icons/ability_stealth.blp',
    ["SHAMAN_elemental"] = 'interface/icons/spell_nature_lightning.blp',
    ["SHAMAN_enhancement"] = 'interface/icons/spell_nature_lightningshield.blp',
    ["SHAMAN_restoration"] = 'interface/icons/spell_nature_magicimmunity.blp',
    ["WARLOCK_affliction"] = 'interface/icons/spell_shadow_deathcoil.blp',
    ["WARLOCK_demonology"] = 'interface/icons/spell_shadow_metamorphosis.blp',
    ["WARLOCK_destruction"] = 'interface/icons/spell_shadow_rainoffire.blp',
    ["WARRIOR_protection"] = 'interface/icons/inv_shield_06.blp',
    ["WARRIOR_arms"] = 'interface/icons/ability_rogue_eviscerate.blp',
    ["WARRIOR_fury"] = 'interface/icons/ability_warrior_innerrage.blp'
}

MSHB.tooltipCache = {}

function MSHB:getSupportedModesDescription()
    result = {}
    local n = 1
    for i, v in pairs(self.supportedModes) do
        result[n] = v["name"] .. " - " .. v["description"]
        n = n + 1
    end
    return table.concat(result, "\n")
end

function MSHB:getCurrentPhase()
    local phaseResult = 0
    local now = time()
    for i, v in pairs(self.supportedPhases) do
        if v["start"] < time() then
            phaseResult = phaseResult + 1
        end
    end
    return phaseResult
end

function MSHB:generateSelectFromTable(tab, fieldName)
    local gen = {}
    for k, v in pairs(tab) do
        gen[k] = v[fieldName]
    end
    return gen
end

function MSHB:pconcat(tab, joinChar)
    local ctab = {}
    local n = 1
    for k, v in pairs(tab) do
        ctab[n] = k
        n = n + 1
    end
    return table.concat(ctab, joinChar)
end

function MSHB:to_pascal_case(input)
    local result = input:sub(1, 1):upper() .. input:sub(2):lower()
    return result
end

function MSHB:predict_player(target, inspect)
    local _, englishClass, classIndex = UnitClass(target)
    local predictedSpec = ""
    local predictedSpecSpentPoints = -1
    for i = 1, GetNumTalentTabs(inspect) do
        local name, texture, pointsSpent, fileName = GetTalentTabInfo(i, inspect)
        if predictedSpecSpentPoints < pointsSpent then
            predictedSpec = name
            predictedSpecSpentPoints = pointsSpent
        end
    end
    return englishClass, predictedSpec
end

function MSHB:player_is_master_looter()
    lootmethod, masterlooterPartyID, masterlooterRaidID = GetLootMethod()
    if lootmethod == "master" and (masterlooterPartyID == 0 or masterlooterRaidID == 0) then
        return true
    end

    return false
end

function MSHB:render_multiphase(multi)
    local current = MeSoHordieAddon.db.char.phase
    if multi == 0 then
        return ""
    end
    local lastBiSPhase = current + multi
    if lastBiSPhase == 5 then
        return " (<End)"
    end
    return " (<P" .. lastBiSPhase .. ")"
end

function MSHB:append_spec(tooltip, class, spec, role, multi)
    if spec == "all" then
        tooltip:AddLine(
            "|Tinterface/icons/classicon_" .. class .. ".blp:0|t" .. " " .. "|Tinterface/icons/classicon_" .. class ..
                ".blp:0|t" .. " " .. self:to_pascal_case(class) .. " - " .. self:to_pascal_case(spec) .. " - " .. role ..
                self:render_multiphase(multi), r, g, b)
        return
    end

    tooltip:AddLine("|Tinterface/icons/classicon_" .. class .. ".blp:0|t" .. " " .. "|T" ..
                        self.spec_icon_table[class .. '_' .. spec:lower()] .. ":0|t" .. " " ..
                        self:to_pascal_case(class) .. " - " .. self:to_pascal_case(spec) .. " - " .. role ..
                        self:render_multiphase(multi), r, g, b)
end

function MSHB:has_key(tab, val)
    for index, value in pairs(tab) do
        if index == val then
            return true
        end
    end

    return false
end

function MSHB:has_value(tab, val)
    for index, value in ipairs(tab) do
        if value == val then
            return true
        end
    end

    return false
end

function MSHB:has_value_nested(tab, val)
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

    return false
end

function MSHB:guild_member()
    if MeSoHordieAddon.db.char.ignoreGuildCheck then
        return true
    end

    local guildName, _, _ = GetGuildInfo("player")
    local realmName = GetRealmName()

    if guildName == "Me So Hordie" and realmName == "Nethergarde Keep" then
        return true
    end
    return false
end

function MSHB:bis_for_multiple_phase(class, spec, role, itemId, phase)
    if not MeSoHordieAddon.db.char.showMultiPhaseIndicator then
        return 0
    end

    local result = 0
    for i, v in pairs(self.supportedPhases) do
        if i > phase then
            local futurePhaseSpecBis = msh_bis_addon_data["phases"]["phase" .. i][class]
            local oldAmount = result
            for i, v in ipairs(futurePhaseSpecBis) do
                if v["spec"] == spec then
                    if self:has_value_nested(v["items"], itemId) then
                        result = result + 1
                    end
                end
            end

            if oldAmount == result then
                return result
            end
        end
    end

    return result
end

function MSHB:append_tooltip(tooltip)
    if not self:guild_member() then
        return
    end

    local _, itemLink = tooltip:GetItem()

    if itemLink == nil then
        return
    end

    local itemId = select(3, strfind(itemLink, "item:(%d+)"))
    local class, spec = self:predict_player("player", false)
    local currentPhaseBiSClass = msh_bis_addon_data["phases"]["phase" .. MeSoHordieAddon.db.char.phase][class:lower()]
    local isPlayerLootMaster = self:player_is_master_looter()
    local currentMode = ""

    local lines = {}

    local cacheKey = itemId .. MeSoHordieAddon.db.char.mode .. MeSoHordieAddon.db.char.phase .. class .. spec ..
                         tostring(isPlayerLootMaster)

    if (MSHB.tooltipCache.key and MSHB.tooltipCache.key == cacheKey) then
        lines = MSHB.tooltipCache.result
    else
        if MeSoHordieAddon.db.char.mode == "spec" and not isPlayerLootMaster then
            currentMode = "(" .. self.supportedModes[MeSoHordieAddon.db.char.mode]["name"] .. " mode)"
            for index, bisClass in ipairs(currentPhaseBiSClass) do
                if bisClass["spec"] == spec:lower() or bisClass["spec"]:lower() == "all" then
                    if self:has_value_nested(bisClass["items"], itemId) then
                        local multi = self:bis_for_multiple_phase(class:lower(), bisClass["spec"]:lower(),
                            bisClass["role"]:lower(), itemId, MeSoHordieAddon.db.char.phase)
                        lines[#lines + 1] = {class, bisClass["spec"], bisClass["role"], multi}
                    end
                end
            end
        end

        if MeSoHordieAddon.db.char.mode == "class" and not isPlayerLootMaster then
            currentMode = "(" .. self.supportedModes[MeSoHordieAddon.db.char.mode]["name"] .. " mode)"
            for index, bisClass in ipairs(currentPhaseBiSClass) do
                if self:has_value_nested(bisClass["items"], itemId) then
                    local multi = self:bis_for_multiple_phase(class:lower(), bisClass["spec"]:lower(),
                        bisClass["role"]:lower(), itemId, MeSoHordieAddon.db.char.phase)
                    lines[#lines + 1] = {class, bisClass["spec"], bisClass["role"], multi}
                end
            end
        end

        if MeSoHordieAddon.db.char.mode == "all" or isPlayerLootMaster then
            currentMode = "(" .. self.supportedModes["all"]["name"] .. " mode)"
            for i, c in pairs(msh_bis_addon_data["phases"]["phase" .. MeSoHordieAddon.db.char.phase]) do
                for j, s in ipairs(c) do
                    if self:has_value_nested(s["items"], itemId) then
                        local multi = self:bis_for_multiple_phase(i:lower(), s["spec"]:lower(), s["role"]:lower(),
                            itemId, MeSoHordieAddon.db.char.phase)
                        lines[#lines + 1] = {i:upper(), s["spec"], s["role"], multi}
                    end
                end
            end
        end

        MSHB.tooltipCache.key = cacheKey
        MSHB.tooltipCache.result = lines
    end

    if next(lines) ~= nil then
        tooltip:AddLine("Me So Hordie BiS - Phase " .. MeSoHordieAddon.db.char.phase .. " " .. currentMode)
        for i, v in ipairs(lines) do
            self:append_spec(tooltip, v[1], v[2], v[3], v[4])
        end
    end
end

function MSHB:string_split(s, delimiter)
    result = {}
    for match in (s .. delimiter):gmatch("(.-)" .. delimiter) do
        table.insert(result, match)
    end
    return result
end

function MSHB:UpdateButton(button, target)
    if button.mshbIndicator then
        button.mshbIndicator:Hide()
    end

    if not self:guild_member() then
        return
    end

    if not MeSoHordieAddon.db.char.showBisIndicator then
        return
    end

    local slotID = button:GetID()

    self:AddIndicatorToButtonIfNeeded(button)

    if (slotID >= INVSLOT_FIRST_EQUIPPED and slotID <= INVSLOT_LAST_EQUIPPED) then
        if target == "player" then
            local item = Item:CreateFromEquipmentSlot(slotID)
            if item:IsItemEmpty() then
                return
            end
            return item:ContinueOnItemLoad(function()
                local id = item:GetItemID()
                if id then
                    self:ShowIndicatorIfBiS(button, id, "player", false)
                end
            end)
        else
            local itemId = GetInventoryItemID(target, slotID)
            if itemId then
                self:ShowIndicatorIfBiS(button, itemId, "target", true)
                return button.mshbIndicator
            end
        end
    end

    return button.mshbIndicator and button.mshbIndicator:Hide()
end

function MSHB:AddIndicatorToButtonIfNeeded(button)
    if button.mshbIndicator then
        return
    end
    local overlayFrame = CreateFrame("FRAME", nil, button)
    overlayFrame:SetFrameLevel(4)
    overlayFrame:SetAllPoints()
    button.mshbIndicator = overlayFrame:CreateTexture(nil, "OVERLAY")
    button.mshbIndicator:SetSize(14, 14)
    button.mshbIndicator:SetPoint('TOPRIGHT', 4, 0)
    button.mshbIndicator:SetAtlas("worldquest-tracker-checkmark")
    button.mshbIndicator:Hide()
end

function MSHB:ShowIndicatorIfBiS(button, itemId, unit, inspect)
    local class, spec = self:predict_player(unit, inspect)
    local bisClass = msh_bis_addon_data["phases"]["phase" .. MeSoHordieAddon.db.char.phase][class:lower()]
    for i, v in ipairs(bisClass) do
        if v["spec"] == spec:lower() or v["spec"]:lower() == "all" then
            if self:has_value_nested(v["items"], tostring(itemId)) then
                button.mshbIndicator:Show()
            end
        end
    end
end
