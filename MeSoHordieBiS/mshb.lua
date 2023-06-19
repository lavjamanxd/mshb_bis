MSHB = {}

MSHB.supportedPhases = {
    [0] = {
        name = "Pre-Raid",
        start = time {
            year = 2022,
            month = 9,
            day = 26
        }
    },
    [1] = {
        name = "Phase 1 - Naxx/OS/EoE/VoA",
        start = time {
            year = 2022,
            month = 10,
            day = 6
        }
    },
    [2] = {
        name = "Phase 2 - Ulduar",
        start = time {
            year = 2023,
            month = 1,
            day = 19
        }
    },
    [3] = {
        name = "Phase 3 - TotC/Onyxia",
        start = time {
            year = 2023,
            month = 6,
            day = 20
        }
    }
}

MSHB.inventorySlots = { "head", "neck", "shoulders", "back", "chest", "wrists", "mainHand", "offHand", "hands", "belt",
    "legs", "feet", "ring", "trinket", "ranged" }

MSHB.inventorySlotsLabels = {
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

MSHB.inventorySlotIdMap = {
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

MSHB.tooltipCache = {}

function MSHB:getSupportedModesDescription()
    local result = {}
    local n = 1
    for _, v in pairs(self.supportedModes) do
        result[n] = v["name"] .. " - " .. v["description"]
        n = n + 1
    end
    return table.concat(result, "\n")
end

function MSHB:getCurrentPhase()
    local phaseResult = -1
    local now = time()
    for _, v in pairs(self.supportedPhases) do
        if v["start"] < now then
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
        local activeSpec = GetActiveTalentGroup(inspect)
        local name, texture, pointsSpent, fileName = GetTalentTabInfo(i, inspect, false, activeSpec)
        if predictedSpecSpentPoints < pointsSpent then
            predictedSpec = name
            predictedSpecSpentPoints = pointsSpent
        end
    end
    return englishClass, predictedSpec
end

function MSHB:player_is_master_looter()
    local lootmethod, masterlooterPartyID, masterlooterRaidID = GetLootMethod()
    if lootmethod == "master" and (masterlooterPartyID == 0 or masterlooterRaidID == 0) then
        return true
    end

    return false
end

function MSHB:guild_member()
    local guildName, _, _ = GetGuildInfo("player")
    local realmName = GetRealmName()

    if guildName == "Me So Hordie" and realmName == "Nethergarde Keep" then
        return true
    end
    return false
end

function MSHB:get_extra_from_group(itemId, class, spec, role, nth, group)
    if group == nil then
        return ""
    end

    if self:has_value_nested(group, "34664") and itemId ~= group[1][1] then
        return " |Tinterface/icons/spell_nature_elementalshields.blp:0|t"
    end

    return ""
end

function MSHB:append_spec(tooltip, itemId, class, spec, role, nth, group, slotID)
    local classIcon = "classicon_" .. class .. ".blp"
    local specIcon = self.spec_icon_table[class .. '_' .. spec:lower()]

    if class == "DEATHKNIGHT" then
        classIcon = "spell_deathknight_classicon.blp"
    end

    if class == "DRUID" and spec == "feral combat" and role == "DPS" then
        specIcon = self.spec_icon_table[class .. '_' .. spec:lower() .. "_cat"]
    end

    local prefix = tostring(nth) .. ". ";

    if self:guild_member() then
        if nth == 1 or (nth == 2 and (slotID == "INVTYPE_TRINKET" or slotID == "INVTYPE_FINGER")) then
            prefix = "BiS "
        end
    end


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

    return nil
end

function MSHB:get_table_which_contains(tab, val)
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

function MSHB:get_tables_which_contains(tab, val)
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

function MSHB:indexOf(tab, val)
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

function MSHB:getIndexOfFromMultipleGroups(groups, itemId)
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

function MSHB:append_tooltip(tooltip, forcedAllMode)
    local _, itemLink = tooltip:GetItem()

    if itemLink == nil then
        return
    end

    local itemId = select(3, strfind(itemLink, "item:(%d+)"))

    if itemId == nil then
        return
    end

    local class, spec = self:predict_player("player", false)
    local currentPhaseBiSClass = msh_bis_addon_data["phases"]["phase" .. MeSoHordieAddon.db.char.phase][class:lower()]
    local isPlayerLootMaster = self:player_is_master_looter()
    local currentMode = ""

    local lines = {}

    local cacheKey = itemId .. MeSoHordieAddon.db.char.mode .. MeSoHordieAddon.db.char.phase .. class .. spec ..
        tostring(isPlayerLootMaster) .. tostring(forcedAllMode)

    if (MSHB.tooltipCache.key and MSHB.tooltipCache.key == cacheKey) then
        lines = MSHB.tooltipCache.result
        currentMode = MSHB.tooltipCache.mode
    else
        local itemEquipLocation = select(4, GetItemInfoInstant(itemId));

        if itemEquipLocation ~= "" then
            if MeSoHordieAddon.db.char.mode == "spec" and not isPlayerLootMaster and not forcedAllMode then
                currentMode = "(" .. self.supportedModes[MeSoHordieAddon.db.char.mode]["name"] .. " mode)"
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

            if MeSoHordieAddon.db.char.mode == "class" and not isPlayerLootMaster and not forcedAllMode then
                currentMode = "(" .. self.supportedModes[MeSoHordieAddon.db.char.mode]["name"] .. " mode)"
                for index, bisClass in ipairs(currentPhaseBiSClass) do
                    local index, group = self:getIndexOfFromMultipleGroups(bisClass["items"], itemId)
                    if group then
                        lines[#lines + 1] = { class, bisClass["spec"], bisClass["role"], index, group, itemEquipLocation }
                    end
                end
            end

            if MeSoHordieAddon.db.char.mode == "all" or isPlayerLootMaster or forcedAllMode then
                currentMode = "(" .. self.supportedModes["all"]["name"] .. " mode)"
                for i, c in pairs(msh_bis_addon_data["phases"]["phase" .. MeSoHordieAddon.db.char.phase]) do
                    for _, s in ipairs(c) do
                        local index, group = self:getIndexOfFromMultipleGroups(s["items"], itemId)
                        if group then
                            lines[#lines + 1] = { i:upper(), s["spec"], s["role"], index, group, itemEquipLocation }
                        end
                    end
                end
            end
        end


        MSHB.tooltipCache.key = cacheKey
        table.sort(lines, function(k1, k2)
            return k1[4] < k2[4]
        end)
        MSHB.tooltipCache.result = lines
        MSHB.tooltipCache.mode = currentMode
    end

    if next(lines) ~= nil then
        local phase = "Pre-Raid"
        if MeSoHordieAddon.db.char.phase > 0 then
            phase = "Phase " .. MeSoHordieAddon.db.char.phase;
        end
        tooltip:AddLine("Me So Hordie BiS - " .. phase .. " " .. currentMode)
        for i, v in ipairs(lines) do
            self:append_spec(tooltip, itemId, v[1], v[2], v[3], v[4], v[5], v[6])
        end
    end
end

function MSHB:string_split(s, delimiter)
    local result = {}
    for match in (s .. delimiter):gmatch("(.-)" .. delimiter) do
        table.insert(result, match)
    end
    return result
end

function MSHB:UpdateButton(button, target)
    if button.mshbIndicator then
        button.mshbIndicator:Hide()
    end

    if not MeSoHordieAddon.db.char.showBisIndicator then
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
    button.mshbIndicator:Hide()
end

function MSHB:ShowIndicatorIfBiS(slotID, button, itemId, unit, inspect)
    local class, spec = self:predict_player(unit, inspect)
    local bisClass = msh_bis_addon_data["phases"]["phase" .. MeSoHordieAddon.db.char.phase][class:lower()]

    if not bisClass then
        return
    end

    for _, v in ipairs(bisClass) do
        if v["spec"] == spec:lower() or v["spec"]:lower() == "all" then
            local index, group = self:getIndexOfFromMultipleGroups(v["items"], tostring(itemId))
            if group then
                if index == 1 or (index == 2 and (slotID == 11 or slotID == 12 or slotID == 13 or slotID == 14)) then
                    button.mshbIndicator:SetAtlas("worldquest-tracker-checkmark")
                else
                    button.mshbIndicator:SetAtlas("poi-door-arrow-up")
                end
            else
                button.mshbIndicator:SetAtlas("Objective-Fail")
            end

            button.mshbIndicator:Show()
        end
    end
end
