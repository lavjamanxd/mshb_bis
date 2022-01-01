MeSoHordieAddon = LibStub("AceAddon-3.0"):NewAddon("MyAddon", "AceConsole-3.0", "AceHook-3.0")

MSHB = {}

MSHB.currentPhase = 2;

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

function MSHB:to_pascal_case(input)
    local result = input:sub(1, 1):upper() .. input:sub(2):lower();
    return result
end

function MSHB:get_class_color(class)
    local colors = RAID_CLASS_COLORS[class]
    return colors.r, colors.g, colors.b
end

function MSHB:predict_player()
    local _, englishClass, classIndex = UnitClass("player")
    local predictedSpec = ""
    local predictedSpecSpentPoints = -1
    for i = 1, GetNumTalentTabs() do
        local name, texture, pointsSpent, fileName = GetTalentTabInfo(i);
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
            "|Tinterface/icons/classicon_" .. class .. ".blp:0|t" .. "      " .. MSHB:to_pascal_case(class) .. " - " ..
                MSHB:to_pascal_case(spec) .. " - " .. role, r, g, b)
        return
    end

    tooltip:AddLine("|Tinterface/icons/classicon_" .. class .. ".blp:0|t" .. " " .. "|T" ..
                        MSHB.spec_icon_table[class .. '_' .. spec:lower()] .. ":0|t" .. " " ..
                        MSHB:to_pascal_case(class) .. " - " .. MSHB:to_pascal_case(spec) .. " - " .. role, r, g, b)
end

function MSHB:has_value(tab, val)
    for index, value in ipairs(tab) do
        if value == val then
            return true
        end
    end

    return false
end

function MSHB:append_tooltip(tooltip)
    local _, itemLink = tooltip:GetItem()

    if itemLink == nil then
        return
    end

    local itemId = select(3, strfind(itemLink, "item:(%d+)"))
    local class, spec = MSHB:predict_player();
    local bisClass = msh_bis_list["phase" .. MSHB.currentPhase][class:lower()];
    local r, g, b = GetClassColor(class);
    local isPlayerLootMaster = MSHB:player_is_master_looter();
    local currentMode = ""

    local lines = {}

    if MeSoHordieAddon.db.char.mode == 'spec' and not isPlayerLootMaster then
        currentMode = "(Spec mode)"
        for i, v in ipairs(bisClass) do
            if v["spec"] == spec:lower() or v["spec"]:lower() == "all" then
                if MSHB:has_value(v["items"], itemId) then
                    lines[#lines + 1] = {class, v["spec"], v["role"]}
                end
            end
        end
    end

    if MeSoHordieAddon.db.char.mode == 'class' and not isPlayerLootMaster then
        currentMode = "(Class mode)"
        for i, v in ipairs(bisClass) do
            if MSHB:has_value(v["items"], itemId) then
                lines[#lines + 1] = {class, v["spec"], v["role"]}
            end
        end
    end

    if MeSoHordieAddon.db.char.mode == 'all' or isPlayerLootMaster then
        currentMode = "(All mode)"
        for i, c in pairs(msh_bis_list["phase" .. MSHB.currentPhase]) do
            for j, s in ipairs(c) do
                if MSHB:has_value(s["items"], itemId) then
                    lines[#lines + 1] = {i:upper(), s["spec"], s["role"]}
                end
            end
        end
    end

    if next(lines) ~= nil then
        tooltip:AddLine("Me So Hordie BiS - Phase " .. MSHB.currentPhase .. " " .. currentMode)
        for i, v in ipairs(lines) do
            MSHB:append_spec(tooltip, v[1], v[2], v[3])
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

function MSHB:change_mode(mode)
    if (mode == nil) then
        print("Available modes: spec, class, all")
        return
    end

    if mode == "spec" or mode == "class" or mode == "all" then
        MeSoHordieAddon.db.char.mode = mode
        print("Mode changed to ".. mode .. " mode!")
        return
    end

    print("Invalid mode specified" .. mode)
end

function MeSoHordieAddon:MSHBInputProcessorFunc(input)
    if input == "" then
        print("Me So Hordie BiS commands:")
        print("/mshb mode <mode>")
        return
    end

    local split = MSHB:string_split(input, " ")

    if (split[1] == "mode") then
        MSHB:change_mode(split[2])
    end
end

function MeSoHordieAddon:OnInitialize()
    local guildName, _, _ = GetGuildInfo("player")
    local realmName = GetRealmName()

    if guildName == "Me So Hordie" and realmName == "Nethergarde Keep" then
        self.db = LibStub("AceDB-3.0"):New("MeSoHordieAddonDB", {
            char = {
                mode = 'spec'
            }
        })

        GameTooltip:HookScript("OnTooltipSetItem", function(t)
            MSHB:append_tooltip(t)
        end)
        ItemRefTooltip:HookScript("OnTooltipSetItem", function(t)
            MSHB:append_tooltip(t)
        end)

        MeSoHordieAddon:RegisterChatCommand("mshb", "MSHBInputProcessorFunc")
    end
end

function MeSoHordieAddon:OnEnable()

end
