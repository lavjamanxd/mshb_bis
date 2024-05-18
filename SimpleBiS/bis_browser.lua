SBL.aceGui = LibStub("AceGUI-3.0")

SBL.gui = {}
SBL.gui.isBiSBrowserOpen = false
SBL.gui.state = {}

function SBL:UpdateTooltipWithForceAllMode(frame)
    self:append_tooltip(frame, true)
end

function SBL:InitializeUI()
    self:RegisterItemWidgetLayout()
end

function SBL:RegisterItemWidgetLayout()
    self.aceGui:RegisterLayout("ItemWidgetLayout", function(content, children)
        local index = children[1]
        local icon = children[2]
        local itemName = children[3]
        local source = children[4]
        local ident = children[5]

        index.frame:SetPoint("LEFT", content, "LEFT", 0, 0)
        index.frame:Show()

        if icon ~= nil then
            icon:SetWidth(30)
            icon:SetHeight(30)
            local xOffset = 20
            if content.ident then
                xOffset = xOffset + 30
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

function SBL:GetAllSpecsForPhase(phase, class)
    local result = {}
    for _, specObj in ipairs(sbl_bis_addon_data["phases"]["phase" .. phase][class:lower()]) do
        result[specObj.spec] = self:to_pascal_case(specObj.spec)
    end

    return result
end

function SBL:GetAllClassesForPhase(phase)
    local result = {}
    for class, _ in pairs(sbl_bis_addon_data["phases"]["phase" .. phase]) do
        result[class] = self:to_pascal_case(class)
    end

    return result
end

function SBL:GetAllRolesForSpec(phase, class, spec)
    local result = {}
    for _, specObj in ipairs(sbl_bis_addon_data["phases"]["phase" .. phase][class:lower()]) do
        if spec:lower() == specObj.spec then
            result[specObj.role] = self:to_pascal_case(specObj.role)
        end
    end

    return result
end

function SBL:CloseBiSWindow()
    if self.gui.isBiSBrowserOpen then
        self.gui.isBiSBrowserOpen = false
        self.gui.RootFrame:Hide()
        return true
    end

    return false
end

function SBL:InvalidateTooltip()
    if self.gui.state.tooltipVisible then
        GameTooltip:SetOwner(self.gui.state.currentTooltipOwner.frame, "ANCHOR_LEFT")
        GameTooltip:SetItemByID(self.gui.state.tooltipItemShown)
        GameTooltip:Show()
    else
        GameTooltip:Hide()
    end
end

function SBL:ShowBiSWindow()
    if self:CloseBiSWindow() then
        return
    end
    self.gui.isBiSBrowserOpen = true
    self.gui.state.phase = self.db.char.phase
    local class, spec = self:predict_player("player", false)
    self.gui.state.class = class
    self.gui.state.spec = spec
    self.gui.state.missingOnly = self.db.char.missingOnlyEnabled
    self.gui.state.tooltipVisible = false
    self.gui.state.tooltipItemShown = -1
    self.gui.state.currentTooltipOwner = nil

    local frame = self.aceGui:Create("Window")
    self.gui.RootFrame = frame
    frame:EnableResize(false)
    frame:SetWidth(512)
    frame:SetHeight(700)
    frame.frame:EnableKeyboard(true)
    frame.frame:SetScript("OnKeyDown", function(self, key)
        if key == "ESCAPE" then
            frame.frame:SetPropagateKeyboardInput(false)
            SBL:CloseBiSWindow()
        else
            frame.frame:SetPropagateKeyboardInput(true)
        end

        if key == "LSHIFT" then
            frame.frame:SetPropagateKeyboardInput(false)
            SBL:InvalidateTooltip()
        end
    end)

    frame.frame:SetScript("OnKeyUp", function(self, key)
        if key == "LSHIFT" then
            SBL:InvalidateTooltip()
        end
    end)

    frame:SetTitle("Simple BiS Browser")
    frame:SetCallback("OnClose", function(widget)
        SBL.gui.isBiSBrowserOpen = false
        SBL.aceGui:Release(widget)
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
        SBL.gui.state.phase = value
        SBL:InvalidateClassSelector()
        SBL:InvalidateSpecSelector()
        SBL:InvalidateRoleSelector()
        SBL:InvalidateItems()
    end)

    local classSelectorDropDown = self.aceGui:Create("Dropdown")
    classSelectorDropDown:SetRelativeWidth(0.5)
    self.gui.classSelector = classSelectorDropDown
    firstDropDrownGroup:AddChild(classSelectorDropDown)

    classSelectorDropDown:SetCallback("OnValueChanged", function(self, event, value)
        SBL.gui.state.class = value
        SBL:InvalidateSpecSelector()
        SBL:InvalidateRoleSelector()
        SBL:InvalidateItems()
    end)

    local specSelectorDropDown = self.aceGui:Create("Dropdown")
    specSelectorDropDown:SetRelativeWidth(0.5)
    self.gui.specSelector = specSelectorDropDown
    secondDropDownGroup:AddChild(specSelectorDropDown)

    specSelectorDropDown:SetCallback("OnValueChanged", function(self, event, value)
        SBL.gui.state.spec = value
        SBL:InvalidateRoleSelector()
        SBL:InvalidateItems()
    end)

    local roleSelectorDropDown = self.aceGui:Create("Dropdown")
    roleSelectorDropDown:SetRelativeWidth(0.5)
    self.gui.roleSelector = roleSelectorDropDown
    secondDropDownGroup:AddChild(roleSelectorDropDown)

    roleSelectorDropDown:SetCallback("OnValueChanged", function(self, event, value)
        SBL.gui.state.role = value
        SBL:InvalidateItems()
    end)

    local missingOnlyCheckBox = self.aceGui:Create("CheckBox")
    missingOnlyCheckBox:SetLabel("Show upgrades")
    frame:AddChild(missingOnlyCheckBox)
    missingOnlyCheckBox:SetValue(self.gui.state.missingOnly)

    missingOnlyCheckBox:SetCallback("OnValueChanged", function(self, event, value)
        SBL.gui.state.missingOnly = value
        SBL.db.char.missingOnlyEnabled = value
        SBL:InvalidateItems()
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

    self:InvalidateSelectors()
    self:InvalidateItems()
end

function SBL:GetFirstKeyFromTable(table)
    for k, v in pairs(table) do
        return k
    end
end

function SBL:InvalidatePhaseSelector()
    self.gui.phaseSelector:SetList(SBL:generateSelectFromTable(SBL.supportedPhases, "name"))
    self.gui.phaseSelector:SetValue(self.gui.state.phase)
end

function SBL:InvalidateClassSelector()
    local classes = self:GetAllClassesForPhase(self.gui.state.phase)
    self.gui.classSelector:SetList(classes)

    if self:has_key(classes, self.gui.state.class:lower()) == false then
        self.gui.state.class = self:GetFirstKeyFromTable(classes)
    end

    self.gui.classSelector:SetValue(self.gui.state.class:lower())
end

function SBL:InvalidateSpecSelector()
    local specs = self:GetAllSpecsForPhase(self.gui.state.phase, self.gui.state.class)
    local specCount = self:getTableSize(specs)
    self.gui.specSelector:SetList(specs)

    if self:has_key(specs, self.gui.state.spec:lower()) == false then
        self.gui.state.spec = self:GetFirstKeyFromTable(specs)
    end

    self.gui.specSelector:SetValue(self.gui.state.spec:lower())

    if specCount == 1 then
        self.gui.specSelector:SetDisabled(true)
    else
        self.gui.specSelector:SetDisabled(false)
    end
end

function SBL:InvalidateRoleSelector()
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

function SBL:InvalidateSelectors()
    self:InvalidatePhaseSelector()
    self:InvalidateClassSelector()
    self:InvalidateSpecSelector()
    self:InvalidateRoleSelector()
end

function SBL:InvalidateItems()
    local phase = self.gui.state.phase
    local class = self.gui.state.class
    local spec = self.gui.state.spec
    local role = self.gui.state.role
    local missingOnly = self.gui.state.missingOnly
    self:AddItemSlotGroups(self.gui.ItemsContainer, phase, class, spec, role, missingOnly)
end

function SBL:AddItemSlotGroups(parent, phase, class, spec, role, missingOnly)
    parent:ReleaseChildren()
    local currentPhaseBiSClass = sbl_bis_addon_data["phases"]["phase" .. phase][class:lower()]

    for i, v in ipairs(currentPhaseBiSClass) do
        if (v["spec"] == spec:lower() or v["spec"]:lower() == "all") and v["role"] == role then
            for index, slotName in ipairs(SBL.inventorySlots) do
                self:AddItemSlotGroup(parent, slotName, v["items"])
            end
        end
    end

    local bugfixElement = self.aceGui:Create("Label")
    parent:AddChild(bugfixElement)
    bugfixElement:SetHeight(0)
end

function SBL:indexExists(table, indexToLookup)
    for index, element in ipairs(table) do
        if element == indexToLookup then
            return true
        end
    end
    return false
end

function SBL:AddItemSlotGroup(parent, itemSlot, itemGroups)
    if next(itemGroups) == nil or itemGroups[itemSlot] == nil then
        return
    end

    local gotItems = {}

    for index, itemGroup in ipairs(itemGroups[itemSlot]) do
        for _, item in ipairs(itemGroup) do
            if self:CharacterHasItem(item) then
                table.insert(gotItems, index);
            end
        end
    end

    if SBL.gui.state.missingOnly then
        if itemSlot == "trinket" or itemSlot == "ring" then
            if self:indexExists(gotItems, 1) and self:indexExists(gotItems, 2) then
                return
            end
        else
            if self:indexExists(gotItems, 1) or self:indexExists(gotItems, 2) then
                return
            end
        end
    end

    local slotGroup = self.aceGui:Create("CustomInlineGroup")
    parent:AddChild(slotGroup)
    slotGroup:SetTitle(SBL.inventorySlotsLabels[itemSlot])
    slotGroup:SetRelativeWidth(1.0)

    if table.getn(gotItems) ~= 0 then
        if itemSlot == "trinket" or itemSlot == "ring" then
            if self:indexExists(gotItems, 1) and self:indexExists(gotItems, 2) then
                slotGroup.border:SetBackdropBorderColor(0.35, 0.92, 0)
            else
                slotGroup.border:SetBackdropBorderColor(0.90, 0.90, 0)
            end
        else
            if self:indexExists(gotItems, 1) or self:indexExists(gotItems, 2) then
                slotGroup.border:SetBackdropBorderColor(0.35, 0.92, 0)
            else
                slotGroup.border:SetBackdropBorderColor(0.90, 0.90, 0)
            end
        end
    else
        slotGroup.border:SetBackdropBorderColor(0.4, 0.4, 0.4)
    end

    for index, group in ipairs(itemGroups[itemSlot]) do
        for yindex, item in ipairs(group) do
            local ident = yindex ~= 1
            self:AddItemWidget(slotGroup, index, item, ident, itemSlot, self:indexExists(gotItems, index))
        end
    end
end

function SBL:CharacterHasItem(itemId)
    local itemIdNumber = tonumber(itemId)
    if IsEquippedItem(itemId) then
        return true
    else
        for bagSlot = 0, NUM_BAG_SLOTS do
            for containerSlot = 1, C_Container.GetContainerNumSlots(bagSlot) do
                if C_Container.GetContainerItemID(bagSlot, containerSlot) == itemIdNumber then
                    return true
                end
            end
        end
    end
    return false
end

function SBL:AddItemWidget(parent, index, itemId, ident, itemSlot, highlighted)
    local itemIdNumber = tonumber(itemId)
    local itemGroup = self.aceGui:Create("SimpleGroup")
    itemGroup.content.ident = ident

    itemGroup:SetLayout("ItemWidgetLayout")
    itemGroup:SetHeight(38)
    parent:AddChild(itemGroup)

    local itemIndexLabel = self.aceGui:Create("Label")
    itemGroup:AddChild(itemIndexLabel)

    if not ident then
        itemIndexLabel:SetText(index .. ".")
    end

    if highlighted then
        if index == 1 or (index == 2 and (itemSlot == "ring" or itemSlot == "trinket")) then
            itemIndexLabel:SetColor(0.35, 0.92, 0)
        else
            itemIndexLabel:SetColor(0.90, 0.90, 0)
        end
    end

    local itemIcon = self.aceGui:Create("Icon")
    itemIcon:SetImageSize(30, 30)
    itemGroup:AddChild(itemIcon)
    itemIcon:SetCallback("OnEnter", function(widget)
        self.gui.state.tooltipVisible = true
        self.gui.state.tooltipItemShown = itemIdNumber
        self.gui.state.currentTooltipOwner = widget
        self:InvalidateTooltip()
    end)

    itemIcon:SetCallback("OnLeave", function(widget)
        self.gui.state.tooltipVisible = false
        self.gui.state.tooltipItemShown = -1
        self.gui.state.currentTooltipOwner = nil
        self:InvalidateTooltip()
    end)

    itemIcon:SetCallback("OnClick", function(widget, event, button)
        if IsShiftKeyDown() == false and button == "LeftButton" then
            return
        end

        local sName, sLink, iRarity, iLevel, iMinLevel, sType, sSubType, iStackCount = GetItemInfo(itemId)
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

    if highlighted then
        if index == 1 or (index == 2 and (itemSlot == "ring" or itemSlot == "trinket")) then
            itemSourceLabel:SetColor(0.35, 0.92, 0)
        else
            itemSourceLabel:SetColor(0.90, 0.90, 0)
        end
    end

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

function SBL:GetItemSourceString(itemId)
    local source = metadata[tostring(itemId)]
    if source == "" or source == nil then
        return "No data"
    else
        return source
    end
end

function SBL:getTableSize(table)
    local count = 0
    for _ in pairs(table) do
        count = count + 1
    end
    return count
end
