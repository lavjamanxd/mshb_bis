MeSoHordieAddon.aceGui = LibStub("AceGUI-3.0")

MeSoHordieAddon.gui = {}
MeSoHordieAddon.gui.isBiSBrowserOpen = false
MeSoHordieAddon.gui.tooltip = MeSoHordieAddon.gui.tooltip or
                                  CreateFrame('GameTooltip', "MSHBBisItemTooltip", UIParent, 'GameTooltipTemplate')
MeSoHordieAddon.gui.state = {}

function MeSoHordieAddon:InitializeUI()
    self:RegisterItemWidgetLayout()
end

function MeSoHordieAddon:RegisterItemWidgetLayout()
    self.aceGui:RegisterLayout("ItemWidgetLayout", function(content, children)
        local icon = children[1]
        local itemName = children[2]
        local source = children[3]
        local ident = children[4]

        if icon ~= nil then
            icon:SetWidth(30)
            icon:SetHeight(30)
            local xOffset = 0
            if content.ident then
                xOffset = 30
            end
            icon.frame:SetPoint("TOPLEFT", content, "TOPLEFT", xOffset, 0)
            icon.frame:Show()

            if itemName ~= nil then
                itemName:SetWidth(400)
                itemName.frame:SetPoint("LEFT", icon.frame, "TOPRIGHT", 8, -12)
                itemName.frame:Show()
                if source ~= nil then
                    source:SetWidth(400)
                    source.frame:SetPoint("TOPLEFT", itemName.frame, "BOTTOMLEFT", 0, -4)
                    source.frame:Show()
                end
            end
        end

        if ident ~= nil then
            if content.ident == false then
                ident.frame:Hide()
            end
            ident:SetWidth(32)
            ident:SetHeight(32)
            ident.frame:SetPoint("RIGHT", icon.frame, "LEFT", 0, 0)
            ident.frame:Show()
        end
    end)
end

function MeSoHordieAddon:GetAllSpecsForPhase(phase, class)
    local result = {}
    for index, specObj in ipairs(msh_bis_addon_data["phases"]["phase" .. phase][class:lower()]) do
        result[specObj.spec] = MSHB:to_pascal_case(specObj.spec)
    end

    return result
end

function MeSoHordieAddon:GetAllClassesForPhase(phase)
    local result = {}
    for class, value in pairs(msh_bis_addon_data["phases"]["phase" .. phase]) do
        result[class] = MSHB:to_pascal_case(class)
    end

    return result
end

function MeSoHordieAddon:GetAllRolesForSpec(phase, class, spec)
    local result = {}
    for index, specObj in ipairs(msh_bis_addon_data["phases"]["phase" .. phase][class:lower()]) do
        if spec:lower() == specObj.spec then
            result[specObj.role] = MSHB:to_pascal_case(specObj.role)
        end
    end

    return result
end

function MeSoHordieAddon:ShowBiSWindow()
    if self.gui.isBiSBrowserOpen then
        self.gui.isBiSBrowserOpen = false
        self.gui.RootFrame:Hide()
    end

    self.gui.isBiSBrowserOpen = true
    self.gui.state.phase = self.db.char.phase
    local class, spec = MSHB:predict_player("player", false)
    self.gui.state.class = class
    self.gui.state.spec = spec
    self.gui.state.missingOnly = false

    local frame = self.aceGui:Create("Window")
    self.gui.RootFrame = frame
    frame:EnableResize(false)
    frame:SetWidth(512)
    frame:SetHeight(700)

    frame:SetTitle("MSHB BiS Browser")
    frame:SetCallback("OnClose", function(widget)
        self.aceGui:Release(widget)
    end)
    frame:SetLayout("Flow")

    local firstDropDrownGroup = self.aceGui:Create("SimpleGroup")
    frame:AddChild(firstDropDrownGroup)
    firstDropDrownGroup:SetLayout("Flow")
    firstDropDrownGroup:SetRelativeWidth(1.0)

    local secondDropDownGroup = self.aceGui:Create("SimpleGroup")
    frame:AddChild(secondDropDownGroup)
    secondDropDownGroup:SetLayout("Flow")
    secondDropDownGroup:SetRelativeWidth(1.0)

    local phaseSelectorDropDown = self.aceGui:Create("Dropdown")
    phaseSelectorDropDown:SetRelativeWidth(0.5)
    self.gui.phaseSelector = phaseSelectorDropDown
    firstDropDrownGroup:AddChild(phaseSelectorDropDown)

    phaseSelectorDropDown:SetCallback("OnValueChanged", function(self, event, value)
        MeSoHordieAddon.gui.state.phase = value
        MeSoHordieAddon:InvalidateClassSelector()
        MeSoHordieAddon:InvalidateSpecSelector()
        MeSoHordieAddon:InvalidateRoleSelector()
        MeSoHordieAddon:InvalidateItems()
    end)

    local classSelectorDropDown = self.aceGui:Create("Dropdown")
    classSelectorDropDown:SetRelativeWidth(0.5)
    self.gui.classSelector = classSelectorDropDown
    firstDropDrownGroup:AddChild(classSelectorDropDown)

    classSelectorDropDown:SetCallback("OnValueChanged", function(self, event, value)
        MeSoHordieAddon.gui.state.class = value
        MeSoHordieAddon:InvalidateSpecSelector()
        MeSoHordieAddon:InvalidateRoleSelector()
        MeSoHordieAddon:InvalidateItems()
    end)

    local specSelectorDropDown = self.aceGui:Create("Dropdown")
    specSelectorDropDown:SetRelativeWidth(0.5)
    self.gui.specSelector = specSelectorDropDown
    secondDropDownGroup:AddChild(specSelectorDropDown)

    specSelectorDropDown:SetCallback("OnValueChanged", function(self, event, value)
        MeSoHordieAddon.gui.state.spec = value
        MeSoHordieAddon:InvalidateRoleSelector()
        MeSoHordieAddon:InvalidateItems()
    end)

    local roleSelectorDropDown = self.aceGui:Create("Dropdown")
    roleSelectorDropDown:SetRelativeWidth(0.5)
    self.gui.roleSelector = roleSelectorDropDown
    secondDropDownGroup:AddChild(roleSelectorDropDown)

    roleSelectorDropDown:SetCallback("OnValueChanged", function(self, event, value)
        MeSoHordieAddon.gui.state.role = value
        MeSoHordieAddon:InvalidateItems()
    end)

    local missingOnlyCheckBox = self.aceGui:Create("CheckBox")
    missingOnlyCheckBox:SetLabel("Missing only")
    frame:AddChild(missingOnlyCheckBox)
    missingOnlyCheckBox:SetValue(self.gui.state.missingOnly)

    missingOnlyCheckBox:SetCallback("OnValueChanged", function(self, event, value)
        MeSoHordieAddon.gui.state.missingOnly = value
        MeSoHordieAddon:InvalidateItems()
    end)

    local scrollcontainer = self.aceGui:Create("SimpleGroup")
    scrollcontainer:SetFullWidth(true)
    scrollcontainer:SetFullHeight(true)
    scrollcontainer:SetLayout("Fill")

    frame:AddChild(scrollcontainer)

    local scroll = self.aceGui:Create("ScrollFrame")
    self.gui.ItemsContainer = scroll
    scroll:SetLayout("List")
    scrollcontainer:AddChild(scroll)

    MeSoHordieAddon:InvalidateSelectors()
    MeSoHordieAddon:InvalidateItems()
end

function MeSoHordieAddon:GetFirstKeyFromTable(table)
    for k, v in pairs(table) do
        return k
    end
end

function MeSoHordieAddon:InvalidatePhaseSelector()
    self.gui.phaseSelector:SetList(MSHB:generateSelectFromTable(MSHB.supportedPhases, "name"))
    self.gui.phaseSelector:SetValue(self.gui.state.phase)
end

function MeSoHordieAddon:InvalidateClassSelector()
    local classes = self:GetAllClassesForPhase(self.gui.state.phase)
    self.gui.classSelector:SetList(classes)

    if MSHB:has_key(classes, self.gui.state.class:lower()) == false then
        self.gui.state.class = self:GetFirstKeyFromTable(classes)
    end

    self.gui.classSelector:SetValue(self.gui.state.class:lower())
end

function MeSoHordieAddon:InvalidateSpecSelector()
    local specs = self:GetAllSpecsForPhase(self.gui.state.phase, self.gui.state.class)
    local specCount = self:getTableSize(specs)
    self.gui.specSelector:SetList(specs)

    if MSHB:has_key(specs, self.gui.state.spec:lower()) == false then
        self.gui.state.spec = self:GetFirstKeyFromTable(specs)
    end

    self.gui.specSelector:SetValue(self.gui.state.spec:lower())

    if specCount == 1 then
        self.gui.specSelector:SetDisabled(true)
    else
        self.gui.specSelector:SetDisabled(false)
    end
end

function MeSoHordieAddon:InvalidateRoleSelector()
    local roles = self:GetAllRolesForSpec(self.gui.state.phase, self.gui.state.class, self.gui.state.spec)
    local rolesCount = self:getTableSize(roles)
    self.gui.roleSelector:SetList(roles)

    self.gui.state.role = self:GetFirstKeyFromTable(roles)

    self.gui.roleSelector:SetValue(self.gui.state.role)

    if rolesCount == 1 then
        self.gui.roleSelector:SetDisabled(true)
    else
        self.gui.roleSelector:SetDisabled(false)
    end
end

function MeSoHordieAddon:InvalidateSelectors()
    self:InvalidatePhaseSelector()
    self:InvalidateClassSelector()
    self:InvalidateSpecSelector()
    self:InvalidateRoleSelector()
end

function MeSoHordieAddon:InvalidateItems()
    local phase = self.gui.state.phase
    local class = self.gui.state.class
    local spec = self.gui.state.spec
    local role = self.gui.state.role
    local missingOnly = self.gui.state.missingOnly
    MeSoHordieAddon:AddItemSlotGroups(self.gui.ItemsContainer, phase, class, spec, role, missingOnly)
end

function MeSoHordieAddon:AddItemSlotGroups(parent, phase, class, spec, role, missingOnly)
    parent:ReleaseChildren()
    local currentPhaseBiSClass = msh_bis_addon_data["phases"]["phase" .. phase][class:lower()]

    for i, v in ipairs(currentPhaseBiSClass) do
        if v["spec"] == spec:lower() or v["spec"]:lower() == "all" and v["role"] == role then
            for index, slotName in ipairs(MSHB.inventorySlots) do
                self:AddItemSlotGroup(parent, slotName, v["items"][slotName])
            end
        end
    end

    local bugfixElement = self.aceGui:Create("Label")
    parent:AddChild(bugfixElement)
    bugfixElement:SetHeight(0)
end

function MeSoHordieAddon:AddItemSlotGroup(parent, itemSlot, itemGroups)
    if next(itemGroups) == nil then
        return
    end

    local hasItem = false

    for index, itemGroup in ipairs(itemGroups) do
        for yindex, item in ipairs(itemGroup) do
            if self:CharacterHasItem(item) then
                hasItem = true
                break
            end
        end
    end

    if MeSoHordieAddon.gui.state.missingOnly and hasItem then
        return
    end

    local slotGroup = self.aceGui:Create("CustomInlineGroup")
    parent:AddChild(slotGroup)
    slotGroup:SetTitle(MSHB.inventorySlotsLabels[itemSlot])
    slotGroup:SetRelativeWidth(1.0)

    if hasItem then
        slotGroup.border:SetBackdropBorderColor(0.35, 0.92, 0)
    else
        slotGroup.border:SetBackdropBorderColor(0.4, 0.4, 0.4)
    end

    for index, group in ipairs(itemGroups) do
        for yindex, item in ipairs(group) do
            local ident = yindex ~= 1
            self:AddItemWidget(slotGroup, item, ident)
        end
    end
end

function MeSoHordieAddon:CharacterHasItem(itemId)
    local hasItem = false
    if IsEquippedItem(itemId) then
        hasItem = true
    else
        for bagSlot = 0, NUM_BAG_SLOTS do
            for containerSlot = 1, GetContainerNumSlots(bagSlot) do
                if GetContainerItemID(bagSlot, containerSlot) == itemId then
                    hasItem = true
                    break
                end
            end
        end
    end
    return hasItem
end

function MeSoHordieAddon:AddItemWidget(parent, itemId, ident)
    local itemIdNumber = tonumber(itemId)
    local itemGroup = self.aceGui:Create("SimpleGroup")
    itemGroup.content.ident = ident

    itemGroup:SetLayout("ItemWidgetLayout")
    itemGroup:SetHeight(38)
    parent:AddChild(itemGroup)

    local itemIcon = self.aceGui:Create("Icon")
    itemIcon:SetImageSize(30, 30)
    itemGroup:AddChild(itemIcon)
    itemIcon:SetCallback("OnEnter", function(widget)
        self.gui.tooltip:SetOwner(itemIcon.frame, "ANCHOR_LEFT")
        self.gui.tooltip:SetItemByID(itemIdNumber)
        self.gui.tooltip:Show()
    end)

    itemIcon:SetCallback("OnLeave", function(widget)
        self.gui.tooltip:Hide()
    end)

    itemIcon:SetCallback("OnClick", function(widget, event, button)
        if IsShiftKeyDown() == false and button == "LeftButton" then
            return
        end

        local sName, sLink, iRarity, iLevel, iMinLevel, sType, sSubType, iStackCount = GetItemInfo(itemId);
        if ChatFrameEditBox and ChatFrameEditBox:IsVisible() then
            ChatFrameEditBox:Insert(sLink)
        else
            ChatEdit_InsertLink(sLink)
        end
    end)

    local itemNameLabel = self.aceGui:Create("Label")
    itemGroup:AddChild(itemNameLabel)

    local itemSourceLabel = self.aceGui:Create("Label")
    itemGroup:AddChild(itemSourceLabel)
    itemSourceLabel:SetText(self:GetItemSourceString(itemId))

    if ident then
        local identImage = self.aceGui:Create("Image")
        itemGroup:AddChild(identImage)
        identImage:SetImageSize(32, 32)
        identImage:SetImage("Interface/HelpFrame/NewPlayerExperienceParts", 0.893555, 0.956055, 0.517578, 0.642578)
    end

    local item = Item:CreateFromItemID(itemIdNumber)

    item:ContinueOnItemLoad(function()
        local name = item:GetItemName()
        local icon = item:GetItemIcon()
        local quality = item:GetItemQuality()
        itemNameLabel:SetText(name)
        local qualityColor = ITEM_QUALITY_COLORS[quality]
        itemNameLabel:SetColor(qualityColor.r, qualityColor.g, qualityColor.b, 1)
        itemIcon:SetImage(icon)
    end)
end

function MeSoHordieAddon:GetItemSourceString(itemId)
    local source = metadata[tostring(itemId)].source
    if source.drop ~= nil then
        return "Drops from: " .. source.drop.name .. self:FormatIfNotEmpty(" (%s) ", source.drop.zone) .. " - " ..
                   self:FormatPercent(source.drop.chance)
    end

    if source.soldby ~= nil then
        return "Sold by: " .. source.soldby.name .. self:FormatIfNotEmpty(" <%s> ", source.soldby.tag) ..
                   self:FormatIfNotEmpty("in %s", source.soldby.zone) ..
                   self:FormatIfNotEmpty(" for %s", self:getStringFromPrice(source.soldby.price))
    end

    if source.profession ~= nil then
        return "Crafted by: " .. source.profession.name
    end

    if source.quest ~= nil then
        return "Quest reward from: " .. source.quest.name .. " in " ..
                   self:FormatIfNotEmpty(" in %s", source.quest.zone)
    end

    if source.containedin ~= nil then
        return
            "Contained in: " .. source.containedin.name .. self:FormatIfNotEmpty(" in %s", source.containedin.zone) ..
                " - " .. self:FormatPercent(source.containedin.chance)
    end

    return "No data"
end

function MeSoHordieAddon:getStringFromPrice(price)
    local result = ""
    if price == nil then
        return ""
    end

    if price.money then
        if string.len(result) ~= 0 then
            result = result .. " & "
        end
        result = result .. price.money.gold .. "g " .. price.money.silver .. "s " .. price.money.copper .. "c"
    end

    if price.arena then
        if string.len(result) ~= 0 then
            result = result .. " & "
        end
        result = result .. price.arena .. " arena points"
    end

    if price.honor then
        if string.len(result) ~= 0 then
            result = result .. " & "
        end
        result = result .. price.honor .. " honor points"
    end

    if price.item then
        if string.len(result) ~= 0 then
            result = result .. " & "
        end
        if price.item[1].id == 29434 then
            result = result .. price.item[1].amount .. " BoJ"
        end
    end

    return result
end

function MeSoHordieAddon:FormatPercent(percent)
    if percent == "" then
        return "0.00%"
    end

    return string.format("%3.2f%%", percent)
end

function MeSoHordieAddon:FormatIfNotEmpty(format, variable)
    if variable == "" then
        return ""
    end

    return string.format(format, variable)
end

function MeSoHordieAddon:getTableSize(table)
    local count = 0
    for _ in pairs(table) do
        count = count + 1
    end
    return count
end
