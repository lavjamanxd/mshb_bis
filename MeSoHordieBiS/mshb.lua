MSHB = {}

MSHB.supportedPhases = {
    [1] = {
        name = "Phase 1",
        start = time {
            year = 2021,
            month = 6,
            day = 1
        }
    },
    [2] = {
        name = "Phase 2",
        start = time {
            year = 2021,
            month = 9,
            day = 15
        }
    },
    [3] = {
        name = "Phase 3",
        start = time {
            year = 2022,
            month = 1,
            day = 27
        }
    }
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
    ["DRUID_feral"] = 'interface/icons/ability_racial_bearform.blp',
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

function MSHB:getSupportedModesDescription()
    result = {}
    local n = 1
    for i, v in pairs(self.supportedModes) do
        result[n] = v["name"] .. " - " .. v["description"]
        n= n+1
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
    local result = input:sub(1, 1):upper() .. input:sub(2):lower();
    return result
end

function MSHB:predict_player(target, inspect)
    local _, englishClass, classIndex = UnitClass(target)
    local predictedSpec = ""
    local predictedSpecSpentPoints = -1
    for i = 1, GetNumTalentTabs(inspect) do
        local name, texture, pointsSpent, fileName = GetTalentTabInfo(i, inspect);
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

function MSHB:append_spec(tooltip, class, spec, role)
    if spec == "all" then
        tooltip:AddLine(
            "|Tinterface/icons/classicon_" .. class .. ".blp:0|t" .. " " .. "|Tinterface/icons/classicon_" .. class ..
                ".blp:0|t" .. " " .. self:to_pascal_case(class) .. " - " .. self:to_pascal_case(spec) .. " - " .. role,
            r, g, b)
        return
    end

    tooltip:AddLine("|Tinterface/icons/classicon_" .. class .. ".blp:0|t" .. " " .. "|T" ..
                        self.spec_icon_table[class .. '_' .. spec:lower()] .. ":0|t" .. " " ..
                        self:to_pascal_case(class) .. " - " .. self:to_pascal_case(spec) .. " - " .. role, r, g, b)
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

function MSHB:guild_member()
    local guildName, _, _ = GetGuildInfo("player")
    local realmName = GetRealmName()

    if guildName ~= "Me So Hordie" and realmName ~= "Nethergarde Keep" then
        return false
    end
    return true
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
    local class, spec = self:predict_player("player", false);
    local bisClass = msh_bis_addon_data["phases"]["phase" .. MeSoHordieAddon.db.char.phase][class:lower()];
    local isPlayerLootMaster = self:player_is_master_looter();
    local currentMode = ""

    local lines = {}

    if MeSoHordieAddon.db.char.mode == "spec" and not isPlayerLootMaster then
        currentMode = "(" .. self.supportedModes[MeSoHordieAddon.db.char.mode]["name"] .. " mode)"
        for i, v in ipairs(bisClass) do
            if v["spec"] == spec:lower() or v["spec"]:lower() == "all" then
                if self:has_value(v["items"], itemId) then
                    lines[#lines + 1] = {class, v["spec"], v["role"]}
                end
            end
        end
    end

    if MeSoHordieAddon.db.char.mode == "class" and not isPlayerLootMaster then
        currentMode = "(" .. self.supportedModes[MeSoHordieAddon.db.char.mode]["name"] .. " mode)"
        for i, v in ipairs(bisClass) do
            if self:has_value(v["items"], itemId) then
                lines[#lines + 1] = {class, v["spec"], v["role"]}
            end
        end
    end

    if MeSoHordieAddon.db.char.mode == "all" or isPlayerLootMaster then
        currentMode = "(" .. self.supportedModes["all"]["name"] .. " mode)"
        for i, c in pairs(msh_bis_addon_data["phases"]["phase" .. MeSoHordieAddon.db.char.phase]) do
            for j, s in ipairs(c) do
                if self:has_value(s["items"], itemId) then
                    lines[#lines + 1] = {i:upper(), s["spec"], s["role"]}
                end
            end
        end
    end

    if next(lines) ~= nil then
        tooltip:AddLine("Me So Hordie BiS - Phase " .. MeSoHordieAddon.db.char.phase .. " " .. currentMode)
        for i, v in ipairs(lines) do
            self:append_spec(tooltip, v[1], v[2], v[3])
        end
    end
end

function MSHB:string_split(s, delimiter)
    result = {};
    for match in (s .. delimiter):gmatch("(.-)" .. delimiter) do
        table.insert(result, match);
    end
    return result;
end

function MSHB:UpdateButton(button, target)
    if not self:guild_member() then
        return
    end

    if button.mshbIndicator then
        button.mshbIndicator:Hide()
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
                    self:ShowIndicatorIfBiS(button, id, "player", false);
                end
            end)
        else
            local itemId = GetInventoryItemID(target, slotID);
            if itemId then
                self:ShowIndicatorIfBiS(button, itemId, "target", true);
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
    local class, spec = self:predict_player(unit, inspect);
    local bisClass = msh_bis_addon_data["phases"]["phase" .. MeSoHordieAddon.db.char.phase][class:lower()];
    for i, v in ipairs(bisClass) do
        if v["spec"] == spec:lower() or v["spec"]:lower() == "all" then
            if self:has_value(v["items"], tostring(itemId)) then
                button.mshbIndicator:Show()
            end
        end
    end
end
