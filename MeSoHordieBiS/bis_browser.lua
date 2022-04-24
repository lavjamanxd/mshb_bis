MeSoHordieAddon.aceGui = LibStub("AceGUI-3.0")

MeSoHordieAddon.gui = {}
MeSoHordieAddon.gui.tooltip = MeSoHordieAddon.gui.tooltip or
                                  CreateFrame('GameTooltip', "MSHBBisItemTooltip", UIParent, 'GameTooltipTemplate')

MeSoHordieAddon.gui.state = {}

function MeSoHordieAddon:InitializeUI()
    self:RegisterItemWidgetLayout()
end

function MeSoHordieAddon:RegisterItemWidgetLayout()
    self.aceGui:RegisterLayout("ItemWidgetLayout", function(content, children)
        if children[1] ~= nil then
            children[1]:SetWidth(30)
            children[1]:SetHeight(30)
            children[1].frame:SetPoint("TOPLEFT", content, "TOPLEFT", 0, 0)
            children[1].frame:Show()

            if children[2] ~= nil then
                children[2]:SetWidth(400)
                children[2].frame:SetPoint("LEFT", children[1].frame, "TOPRIGHT", 8, -12)
                children[2].frame:Show()
                if children[3] ~= nil then
                    children[3]:SetWidth(400)
                    children[3].frame:SetPoint("TOPLEFT", children[2].frame, "BOTTOMLEFT", 0, -4)
                    children[3].frame:Show()
                end
            end
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

function MeSoHordieAddon:ShowBiSWindow()
    self.gui.state.phase = self.db.char.phase;
    local class, spec = MSHB:predict_player("player", false);
    self.gui.state.class = class;
    self.gui.state.spec = spec;
    self.gui.state.missingOnly = false

    local frame = self.aceGui:Create("Frame")
    self.gui.RootFrame = frame

    frame:SetTitle("MSHB BiS Browser")
    frame:SetCallback("OnClose", function(widget)
        self.aceGui:Release(widget)
    end)
    frame:SetLayout("Flow")

    local phaseSelectorDropDown = self.aceGui:Create("Dropdown")
    self.gui.phaseSelector = phaseSelectorDropDown
    frame:AddChild(phaseSelectorDropDown)

    phaseSelectorDropDown:SetCallback("OnValueChanged", function(self, event, value)
        MeSoHordieAddon.gui.state.phase = value;
        MeSoHordieAddon:InvalidateClassSelector()
        MeSoHordieAddon:InvalidateSpecSelector()
        MeSoHordieAddon:InvalidateItems()
    end)

    local classSelectorDropDown = self.aceGui:Create("Dropdown")
    self.gui.classSelector = classSelectorDropDown
    frame:AddChild(classSelectorDropDown)

    classSelectorDropDown:SetCallback("OnValueChanged", function(self, event, value)
        MeSoHordieAddon.gui.state.class = value;
        MeSoHordieAddon:InvalidateSpecSelector()
        MeSoHordieAddon:InvalidateItems()
    end)

    local specSelectorDropDown = self.aceGui:Create("Dropdown")
    self.gui.specSelector = specSelectorDropDown
    frame:AddChild(specSelectorDropDown)

    specSelectorDropDown:SetCallback("OnValueChanged", function(self, event, value)
        MeSoHordieAddon.gui.state.spec = value;
        MeSoHordieAddon:InvalidateItems()
    end)

    local missingOnlyCheckBox = self.aceGui:Create("CheckBox")
    missingOnlyCheckBox:SetLabel("Missing only")
    frame:AddChild(missingOnlyCheckBox)
    missingOnlyCheckBox:SetValue(self.gui.state.missingOnly)

    missingOnlyCheckBox:SetCallback("OnValueChanged", function(self, event, value)
        MeSoHordieAddon.gui.state.missingOnly = value;
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
    self.gui.phaseSelector:SetList(MSHB:generateSelectFromTable(MSHB.supportedPhases, "name"));
    self.gui.phaseSelector:SetValue(self.gui.state.phase)
end

function MeSoHordieAddon:InvalidateClassSelector()
    local classes = self:GetAllClassesForPhase(self.gui.state.phase)
    self.gui.classSelector:SetList(classes);

    if MSHB:has_key(classes, self.gui.state.class:lower()) == false then
        self.gui.state.class = self:GetFirstKeyFromTable(classes)
    end

    self.gui.classSelector:SetValue(self.gui.state.class:lower())
end

function MeSoHordieAddon:InvalidateSpecSelector()
    local specs = self:GetAllSpecsForPhase(self.gui.state.phase, self.gui.state.class)
    self.gui.specSelector:SetList(specs);

    if MSHB:has_key(specs, self.gui.state.spec:lower()) == false then
        self.gui.state.spec = self:GetFirstKeyFromTable(specs)
    end

    self.gui.specSelector:SetValue(self.gui.state.spec:lower())
end

function MeSoHordieAddon:InvalidateSelectors()
    self:InvalidatePhaseSelector()
    self:InvalidateClassSelector()
    self:InvalidateSpecSelector()
end

function MeSoHordieAddon:InvalidateItems()
    local phase = self.gui.state.phase
    local class = self.gui.state.class
    local spec = self.gui.state.spec
    local missingOnly = self.gui.state.missingOnly
    MeSoHordieAddon:AddItemSlotGroups(self.gui.ItemsContainer, phase, class, spec, missingOnly)
end

function MeSoHordieAddon:AddItemSlotGroups(parent, phase, class, spec, missingOnly)
    parent:ReleaseChildren();
    local currentPhaseBiSClass = msh_bis_addon_data["phases"]["phase" .. phase][class:lower()];

    for i, v in ipairs(currentPhaseBiSClass) do
        if v["spec"] == spec:lower() or v["spec"]:lower() == "all" then
            for itemSlot, items in pairs(v["items"]) do
                self:AddItemSlotGroup(parent, itemSlot, items)
            end
        end
    end
end

function MeSoHordieAddon:AddItemSlotGroup(parent, itemSlot, items)
    if next(items) == nil then
        return
    end

    if MeSoHordieAddon.gui.state.missingOnly then
        for index, item in ipairs(items) do
            if self:CharacterHasItem(item) then
                return
            end
        end
    end

    local slotGroup = self.aceGui:Create("InlineGroup")
    parent:AddChild(slotGroup)
    slotGroup:SetTitle(itemSlot)
    slotGroup:SetRelativeWidth(1.0)

    for index, item in ipairs(items) do
        self:AddItemWidget(slotGroup, item)
    end
end

function MeSoHordieAddon:CharacterHasItem(itemId)
    local hasItem = false;
    if IsEquippedItem(itemId) then
        hasItem = true;
    else
        for bagSlot = 0, NUM_BAG_SLOTS do
            for containerSlot = 1, GetContainerNumSlots(bagSlot) do
                if GetContainerItemID(bagSlot, containerSlot) == itemId then
                    hasItem = true;
                    break
                end
            end
        end
    end
    return hasItem;
end

function MeSoHordieAddon:AddItemWidget(parent, itemId)
    local itemIdNumber = tonumber(itemId)
    local itemGroup = self.aceGui:Create("SimpleGroup")
    itemGroup:SetLayout("ItemWidgetLayout")
    itemGroup:SetHeight(40)
    parent:AddChild(itemGroup)

    local itemIcon = self.aceGui:Create("Icon")
    itemIcon:SetImageSize(30, 30)
    itemGroup:AddChild(itemIcon)
    itemIcon:SetCallback("OnEnter", function(widget)
        self.gui.tooltip:SetOwner(itemIcon.frame, "ANCHOR_LEFT")
        self.gui.tooltip:SetItemByID(itemIdNumber)
        self.gui.tooltip:Show();
    end)

    itemIcon:SetCallback("OnLeave", function(widget)
        self.gui.tooltip:Hide()
    end)

    local itemNameLabel = self.aceGui:Create("Label")
    itemGroup:AddChild(itemNameLabel)

    local itemSourceLabel = self.aceGui:Create("Label")
    itemGroup:AddChild(itemSourceLabel)
    itemSourceLabel:SetText(self:GetItemSourceString(itemId))

    local item = Item:CreateFromItemID(itemIdNumber)

    item:ContinueOnItemLoad(function()
        local name = item:GetItemName()
        local icon = item:GetItemIcon()
        local quality = item:GetItemQuality();
        itemNameLabel:SetText(name)
        local qualityColor = ITEM_QUALITY_COLORS[quality]
        itemNameLabel:SetColor(qualityColor.r, qualityColor.g, qualityColor.b, 1)
        itemIcon:SetImage(icon)
    end)
end

function MeSoHordieAddon:GetItemSourceString(itemId)
    local source = metadata[tostring(itemId)].source
    if source.drop ~= nil then
        return
            "Drops from: " .. source.drop[1].name .. " (" .. source.drop[1].zone .. ") - " .. source.drop[1].chance ..
                "%"
    end

    if source.soldby ~= nil then
        return "Sold by: " .. source.soldby[1].name .. " <" .. source.soldby[1].vendor .. ">" ..
                   self:ConcatIfNotEmpty("in %s", source.soldby[1].zone)
    end

    if source.profession ~= nil then
        return "Crafted by: " .. source.profession.name
    end

    if source.quest ~= nil then
        return "Quest reward from: " .. source.quest[1].name .. " in " .. source.quest[1].zone
    end

    if source.containedin ~= nil then
        return "Contained in: " .. source.containedin[1].name .. " in " .. source.containedin[1].zone
    end

    return "No data"
end

function MeSoHordieAddon:ConcatIfNotEmpty(format, variable)
    if variable == "" then
        return ""
    end

    return string.format(format, variable)
end
