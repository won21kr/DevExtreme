"use strict";

window.includeThemesLinks();

require("common.css!");
require("generic_light.css!");
require("ui/data_grid/ui.data_grid");

var $ = require("jquery"),
    commonUtils = require("core/utils/common"),
    devices = require("core/devices"),
    device = devices.real(),
    themes = require("ui/themes"),
    dataGridMocks = require("../../helpers/dataGridMocks.js"),
    publicComponentUtils = require("core/utils/public_component");

themes.current({
    theme: "generic"
});
QUnit.testStart(function() {
    var markup =
        '<div id="container" class="dx-datagrid"></div>';

    $("#qunit-fixture").html(markup);
});

QUnit.module("Column chooser", {
    beforeEach: function() {
        this.clock = sinon.useFakeTimers();
        this.columns = [];
        this.options = {
            columnChooser: {
                enabled: true,
                width: 300,
                height: 350
            }
        };

        dataGridMocks.setupDataGridModules(this, ["columns", "data", "columnChooser", "headerPanel", "editing"], {
            initViews: true,
            controllers: {
                columns: new dataGridMocks.MockColumnsController(this.columns),
                data: new dataGridMocks.MockDataController({ items: [] })
            }
        });

        this.setTestElement = function($rootElement) {
            var $element = $("<div />").appendTo($rootElement);
            this.columnChooserView._$element = $element;
            this.columnChooserView._$parent = $rootElement;
        };

        this.renderColumnChooser = function() {
            this.columnChooserView.showColumnChooser();
            this.columnChooserView.hideColumnChooser();
            this.clock.tick(1000);
        };

        this.columnChooserView._$element = $("#container");
    },
    afterEach: function() {
        this.clock.restore();
        this.columnChooserView.hideColumnChooser();
    }
});

QUnit.test('Bounding rect of groupPanel when panel is not visible', function(assert) {
    //arrange
    var testElement = $('#container');
    this.setTestElement(testElement);

    //act
    this.renderColumnChooser();

    //assert
    assert.equal(this.columnChooserView.getBoundingRect(), null, 'Bounding rect is null when column chooser is not visible');
});

QUnit.test('Bounding rect of groupPanel', function(assert) {
    //arrange
    var testElement = $('#container'),
        boundingRect,
        isBoundingCorrect;

    this.setTestElement(testElement);

    //act
    this.columnChooserView.showColumnChooser();
    this.clock.tick(1000);

    //assert
    boundingRect = this.columnChooserView.getBoundingRect();
    isBoundingCorrect = commonUtils.isObject(boundingRect) && commonUtils.isDefined(boundingRect.top) && commonUtils.isDefined(boundingRect.bottom)
        && commonUtils.isDefined(boundingRect.right) && commonUtils.isDefined(boundingRect.left);

    assert.ok(isBoundingCorrect, 'Bounding rect return object with "top", "bottom", "left" and "right" properties when column chooser is visible');
});

QUnit.test("Draw column chooser (dragAndDrop mode)", function(assert) {
    //arrange
    var testElement = $("#container"),
        $overlayWrapper;

    this.options.columnChooser.emptyPanelText = "Test";
    this.setTestElement(testElement);

    //act
    this.renderColumnChooser();
    this.columnChooserView._popupContainer.option("visible", true);
    this.clock.tick();
    $overlayWrapper = this.columnChooserView._popupContainer._wrapper();

    //assert
    assert.ok($overlayWrapper.hasClass("dx-datagrid-column-chooser"), "has column chooser");
    assert.ok($overlayWrapper.hasClass("dx-datagrid-column-chooser-mode-drag"), "has dragAndDrop mode class");
    assert.ok(!$overlayWrapper.hasClass("dx-datagrid-column-chooser-mode-select"), "hasn't select mode class");
    assert.ok($overlayWrapper.find(".dx-empty-message").length, "has message");
    assert.strictEqual($overlayWrapper.find(".dx-empty-message").text(), "Test", "text message");
});

QUnit.test("Draw column chooser (select mode)", function(assert) {
    //arrange
    var testElement = $("#container"),
        $overlayWrapper;

    this.options.columnChooser.mode = "select";
    this.setTestElement(testElement);

    //act
    this.renderColumnChooser();
    this.columnChooserView._popupContainer.option("visible", true);
    this.clock.tick();
    $overlayWrapper = this.columnChooserView._popupContainer._wrapper();

    //assert
    assert.ok($overlayWrapper.hasClass("dx-datagrid-column-chooser"), "has column chooser");
    assert.ok(!$overlayWrapper.hasClass("dx-datagrid-column-chooser-mode-drag"), "hasn't dragAndDrop mode class");
    assert.ok($overlayWrapper.hasClass("dx-datagrid-column-chooser-mode-select"), "has select mode class");
    assert.ok($overlayWrapper.find(".dx-treeview").length, "has treeview in column chooser");
    assert.ok(!$overlayWrapper.find(".dx-column-chooser-message").length, "hasn't message");
});

QUnit.test("Draw column chooser with hidden columns (dragAndDrop mode)", function(assert) {
    //arrange
    var testElement = $("#container"),
        columnChooserView = this.columnChooserView,
        columnChooser;

    $.extend(this.columns, [{ caption: "Column 1", visible: true }, { caption: "Column 2", visible: false, showInColumnChooser: true }, { caption: "Column 3", visible: false, showInColumnChooser: false }]);
    this.setTestElement(testElement);

    //act
    this.renderColumnChooser();

    //assert
    assert.ok(testElement.find(".dx-datagrid-column-chooser"), "has column chooser");
    assert.ok(!$("body").children(".dx-datagrid-column-chooser").length, "doesn't have wrapper column chooser");

    //act
    columnChooserView._popupContainer.option("visible", true);

    //assert
    columnChooser = $("body").children(".dx-datagrid-column-chooser");
    assert.ok(columnChooser.length, "have wrapper column chooser");
    assert.ok(columnChooser.find(".dx-overlay-content").first().is(":visible"), "visible column chooser");
    assert.ok(columnChooser.find(".dx-popup-content").length, "has popup content");
    assert.equal(columnChooser.find(".dx-popup-content").first().find(".dx-column-chooser-item").length, 1, "count items");
    assert.strictEqual(columnChooser.find(".dx-popup-content").first().find(".dx-column-chooser-item").first().text(), "Column 2", "text item 1");
});

QUnit.test("Draw column chooser with hidden columns (select mode)", function(assert) {
    //arrange
    var testElement = $("#container"),
        columnChooserView = this.columnChooserView,
        $columnChooser,
        items,
        treeView;

    this.options.columnChooser.mode = "select";
    $.extend(this.columns, [{ caption: "Column 1", index: 0, visible: true }, { caption: "Column 2", index: 1, visible: false, showInColumnChooser: true }, { caption: "Column 3", index: 2, visible: false, showInColumnChooser: false }, { caption: "Column 4", index: 3, visible: true }]);
    this.setTestElement(testElement);

    //act
    this.renderColumnChooser();

    columnChooserView._popupContainer.option("visible", true);

    //assert
    $columnChooser = $("body").children(".dx-datagrid-column-chooser");
    treeView = $columnChooser.find(".dx-treeview").dxTreeView("instance");

    items = treeView.option("items");
    assert.ok($columnChooser.length, "have wrapper column chooser");
    assert.ok(treeView, "column chooser has dxTreeView");
    assert.equal(items.length, 3, "treeView has 3 items");
    assert.ok(items[0].selected, "selected first item");
    assert.ok(!items[1].selected, "selected second item");
    assert.ok(items[2].selected, "selected third item");
});

QUnit.test("Hide column chooser when is visible true", function(assert) {
    //arrange
    var testElement = $("#container"),
        columnChooser;
    this.setTestElement(testElement);

    this.renderColumnChooser();

    //assert
    assert.ok(testElement.find(".dx-datagrid-column-chooser").length, "has column chooser");
    assert.ok(!$("body").children(".dx-datagrid-column-chooser").length, "doesn't have wrapper column chooser");

    //act
    this.columnChooserView._popupContainer.option("visible", true);

    //assert
    columnChooser = $("body").children(".dx-datagrid-column-chooser");
    assert.ok(columnChooser.length, "have wrapper column chooser");
    assert.ok(columnChooser.find(".dx-overlay-content").first().is(":visible"), "visible column chooser");

    //act
    columnChooser.find(".dx-closebutton").first().trigger("dxclick"); //hide
    this.clock.tick(500);

    //assert
    assert.ok(!$("body").children(".dx-datagrid-column-chooser").length, "doesn't have wrapper column chooser");
});

QUnit.test("Hide column via column chooser (select mode)", function(assert) {
    //arrange
    var testElement = $("#container"),
        $columnChooser,
        $treeViewItem;

    this.options.columnChooser.mode = "select";
    $.extend(this.columns, [{ caption: "Column 1", index: 0, visible: true }, { caption: "Column 2", index: 1, visible: false, showInColumnChooser: true }, { caption: "Column 3", index: 2, visible: false, showInColumnChooser: false }, { caption: "Column 4", index: 3, visible: true }]);
    this.setTestElement(testElement);

    this.renderColumnChooser();

    //act
    this.columnChooserView._popupContainer.option("visible", true);

    $columnChooser = $("body").children(".dx-datagrid-column-chooser");
    $treeViewItem = $columnChooser.find(".dx-checkbox").first();

    //act
    $treeViewItem.trigger("dxclick");
    this.clock.tick(500);

    //assert
    assert.deepEqual(this.columns[0], { caption: "Column 1", index: 0, visible: false }, "First column is hidden now");
});

QUnit.test("Prevent hiding the last column via column chooser when select mode is using", function(assert) {
    //arrange
    var testElement = $("#container"),
        $columnChooser,
        $treeViewItem;

    this.options.columnChooser.mode = "select";
    $.extend(this.columns, [{ caption: "Column 1", index: 0, visible: true }]);
    this.setTestElement(testElement);

    this.renderColumnChooser();

    //act
    this.columnChooserView._popupContainer.option("visible", true);

    $columnChooser = $("body").children(".dx-datagrid-column-chooser");
    $treeViewItem = $columnChooser.find(".dx-checkbox").first();

    //act
    $treeViewItem.trigger("dxclick");
    this.clock.tick(500);

    //assert
    assert.deepEqual(this.columns[0], { caption: "Column 1", index: 0, visible: true }, "First column is stay visible");
    assert.ok($columnChooser.find(".dx-checkbox").first().hasClass("dx-checkbox-checked"), "The treeview's checkbox is stay checked");
});

QUnit.test("Show column via column chooser (select mode)", function(assert) {
    //arrange
    var testElement = $("#container"),
        $columnChooser,
        $treeViewItem;

    this.options.columnChooser.mode = "select";
    $.extend(this.columns, [{ caption: "Column 1", index: 0, visible: false }, { caption: "Column 2", index: 1, visible: false, showInColumnChooser: true }, { caption: "Column 3", index: 2, visible: false, showInColumnChooser: false }, { caption: "Column 4", index: 3, visible: true }]);
    this.setTestElement(testElement);

    this.renderColumnChooser();

    //act
    this.columnChooserView._popupContainer.option("visible", true);

    $columnChooser = $("body").children(".dx-datagrid-column-chooser");
    $treeViewItem = $columnChooser.find(".dx-checkbox").first();

    //act
    $treeViewItem.trigger("dxclick");
    this.clock.tick(500);

    //assert
    assert.deepEqual(this.columns[0], { caption: "Column 1", index: 0, visible: true }, "First column is hidden now");
});

QUnit.test("Rendering show column chooser button in headerPanel", function(assert) {
    //arrange
    var testElement = $("#container");
    this.setTestElement(testElement);

    this.options.editing = { allowAdding: true };
    //this.columnChooserView.render(testElement);

    //act
    this.renderColumnChooser();
    this.headerPanel.render(testElement);
    this.clock.tick(1000);

    //assert
    assert.ok(testElement.find(".dx-datagrid-column-chooser").length, "has column chooser");
    assert.ok(!$("body").children(".dx-datagrid-column-chooser").length, "doesn't have wrapper column chooser");

    var $toolbarButtons = testElement.find(".dx-datagrid-toolbar-button");

    assert.equal($toolbarButtons.length, 2, "there are 2 buttons in toolbar");
    assert.ok($toolbarButtons.eq(1).hasClass("dx-datagrid-column-chooser-button"), "second button is column chooser");

    //T102389
    assert.ok($toolbarButtons.eq(0).hasClass("dx-edit-button"), "first element is edit (insert) button");
});

QUnit.test("Show column chooser by pressing the button", function(assert) {
    //arrange
    var testElement = $("#container"),
        columnChooser;
    this.setTestElement(testElement);

    this.renderColumnChooser();

    this.clock.tick(1000);
    this.columnChooserController.renderShowColumnChooserButton(testElement);

    //assert
    assert.ok(testElement.find(".dx-datagrid-column-chooser-button").length, "has column chooser button");
    assert.ok(testElement.find(".dx-datagrid-column-chooser").length, "has column chooser");
    assert.ok(!$("body").children(".dx-datagrid-column-chooser").length, "doesn't have wrapper column chooser");

    //act
    testElement.find(".dx-datagrid-column-chooser-button").trigger("dxclick"); //show

    //assert
    columnChooser = $("body").children(".dx-datagrid-column-chooser");
    assert.ok(columnChooser.length, "have wrapper column chooser");
    assert.ok(columnChooser.find(".dx-overlay-content").first().is(":visible"), "visible column chooser");
});

QUnit.test("Get column elements", function(assert) {
    //arrange
    var testElement = $("#container"),
        columnChooserView = this.columnChooserView,
        columnChooser,
        columnHiddenElements;

    $.extend(this.columns, [{ caption: "Column 1", visible: true }, { caption: "Column 2", visible: false, showInColumnChooser: true }, { caption: "Column 3", visible: false, showInColumnChooser: true }]);
    this.setTestElement(testElement);

    this.renderColumnChooser();

    //assert
    assert.ok(testElement.find(".dx-datagrid-column-chooser".length), "has column chooser");
    assert.ok(!$("body").children(".dx-datagrid-column-chooser").length, "doesn't have wrapper column chooser");

    columnChooserView._popupContainer.option("visible", true);

    //assert
    columnChooser = $("body").children(".dx-datagrid-column-chooser");
    assert.ok(columnChooser.length, "have wrapper column chooser");
    assert.ok(columnChooser.find(".dx-overlay-content").first().is(":visible"), "visible column chooser");

    //act
    columnHiddenElements = columnChooserView.getColumnElements();

    //assert
    assert.equal(columnHiddenElements.length, 2, "count hidden elements");
    assert.strictEqual(columnHiddenElements.first().text(), "Column 2", "text hidden element 1");
    assert.strictEqual(columnHiddenElements.last().text(), "Column 3", "text hidden element 2");
});

//B255428
QUnit.test("Get bounding rect", function(assert) {
    //arrange
    var testElement = $("#container"),
        columnChooserView = this.columnChooserView,
        boundingRect;
    this.setTestElement(testElement);

    this.columnChooserView.showColumnChooser();
    this.clock.tick(1000);

    //act
    boundingRect = columnChooserView.getBoundingRect();

    //assert
    assert.equal(boundingRect.right - boundingRect.left, this.options.columnChooser.width, "width columnChooser");
    assert.equal(boundingRect.bottom - boundingRect.top, this.options.columnChooser.height, "height columnChooser");
});

QUnit.test("Get bounding rect when column chooser not visible", function(assert) {
    //arrange
    var testElement = $("#container"),
        columnChooserView = this.columnChooserView,
        boundingRect;

    this.setTestElement(testElement);

    this.renderColumnChooser();

    //act
    boundingRect = columnChooserView.getBoundingRect();

    //assert
    assert.equal(boundingRect, null, "boundingRect null");
});

QUnit.test("Get bounding rect when column chooser not enabled", function(assert) {
    //arrange
    var testElement = $("#container"),
        columnChooserView = this.columnChooserView,
        boundingRect;

    this.setTestElement(testElement);

    this.options.columnChooser = {
        enabled: false
    };

    this.renderColumnChooser();

    //act
    boundingRect = columnChooserView.getBoundingRect();

    //assert
    assert.equal(boundingRect, null, "boundingRect null");
});

QUnit.test("rtlEnabled option set class to an overlay content", function(assert) {
    var testElement = $("#container");

    this.setTestElement(testElement);

    this.options.rtlEnabled = true;

    this._createComponent = function(element, name, config) {
        config.rtlEnabled = true;

        name = typeof name === "string" ? name : publicComponentUtils.name(name);
        var $element = $(element)[name](config || {});
        return $element[name]("instance");
    };

    this.columnChooserView.showColumnChooser();
    this.columnChooserView.hideColumnChooser();

    this.clock.tick(1000);

    assert.ok(testElement.find(".dx-popup-content").first().hasClass("dx-rtl"), "popup content has dx-rtl class when 'rtlEnabled' option is true");
});

QUnit.test("Redraw column chooser with rtlEnabled (changed options)", function(assert) {
    //arrange
    var testElement = $("#container"),
        columnChooserView = this.columnChooserView;

    this.setTestElement(testElement);

    this.options.rtlEnabled = false;

    //act
    this.renderColumnChooser();

    assert.ok(!testElement.find(".dx-overlay-content").first().hasClass("dx-rtl"), "overlay content hasn't dx-rtl class");

    this.options.rtlEnabled = true;

    columnChooserView._initializePopupContainer();
    this.renderColumnChooser();
    assert.ok(testElement.find(".dx-overlay-content").first().hasClass("dx-rtl"), "overlay content has dx-rtl class when 'rtlEnabled' option is true");
});

QUnit.test("Column chooser is draggable", function(assert) {
    //arrange
    var testElement = $("#container"),
        columnChooserContainer;

    //act
    this.setTestElement(testElement);
    this.renderColumnChooser();

    //assert
    columnChooserContainer = this.columnChooserView._popupContainer;
    assert.ok(columnChooserContainer.option("dragEnabled"), "Column chooser is draggable");
});

if(device.deviceType === "desktop") {
    QUnit.test("Close and cancel buttons for generic theme", function(assert) {
        //arrange
        var testElement = $("#container"),
            columnChooserView = this.columnChooserView;

        this.setTestElement(testElement);

        //act
        this.renderColumnChooser();
        columnChooserView._popupContainer.toggle(true);

        //assert
        assert.ok($(".dx-closebutton").length, "closebutton is shown");
        assert.ok(!$(".dx-button-text").length, "cancel button is hidden");
    });
}

if(device.deviceType !== "desktop") {
    QUnit.test("Close and cancel buttons for mobile theme", function(assert) {
        //arrange
        var testElement = $("#container"),
            currentThemes = themes.current(),
            columnChooserView = this.columnChooserView;

        this.setTestElement(testElement);

        themes.current(themes.themeNameFromDevice(device));

        //act
        this.renderColumnChooser();
        columnChooserView._popupContainer.toggle(true);

        //assert
        assert.ok(!$(".dx-closebutton").length, "close button is hidden");
        assert.ok($(".dx-button-text").length, "cancel button is shown");
        themes.current(currentThemes);
    });
}

QUnit.test("Add non touch class when column chooser is shown on win phone", function(assert) {
    //arrange
    var testElement = $("#container");

    this.setTestElement(testElement);

    this.columnChooserView._isWinDevice = function() {
        return true;
    };

    this.renderColumnChooser();

    this.clock.tick(1000);
    this.columnChooserController.renderShowColumnChooserButton(testElement);
    testElement.find(".dx-datagrid-column-chooser-button").trigger("dxclick"); //show

    assert.ok($(document.body).hasClass("dx-datagrid-notouch-action"), "no touch css class");
});

//QUnit.test("Use simulated scrolling on win phone", function(assert) {
//    //arrange
//    var testElement = $("#container");
//
//    this.setTestElement(testElement);
//
//    this.columnChooserView._isWinDevice = function() {
//        return true;
//    };
//
//    this.renderColumnChooser();
//
//    this.clock.tick(1000);
//    this.columnChooserController.renderShowColumnChooserButton(testElement);
//    testElement.find(".dx-datagrid-column-chooser-button").trigger("dxclick"); //show
//
//    var treeView = $(".dx-datagrid-column-chooser-list").first().dxTreeView("instance");
//
//    assert.ok(!treeView.option("useNativeScrolling"), "use simulated scrolling");
//});
//
//QUnit.test("Use simulated scrolling is not force enabled on not win phone", function(assert) {
//    //arrange
//    var testElement = $("#container"),
//        supportNativeScrolling = supportUtils.nativeScrolling;
//
//    supportUtils.nativeScrolling = true;
//    this.columnChooserView._isWinDevice = function() {
//        return false;
//    };
//
//    this.setTestElement(testElement);
//
//    this.renderColumnChooser();
//
//    this.clock.tick(1000);
//    this.columnChooserController.renderShowColumnChooserButton(testElement);
//    testElement.find(".dx-datagrid-column-chooser-button").trigger("dxclick"); //show
//
//    var treeView = $(".dx-datagrid-column-chooser-list").first().dxTreeView("instance");
//
//    assert.equal(treeView.option("useNativeScrolling"), true, "use native scrolling");
//    supportUtils.nativeScrolling = supportNativeScrolling;
//});

QUnit.test("Non touch class is not added when column chooser is shown on not win phone", function(assert) {
    //arrange
    $(document.body).removeClass("dx-datagrid-notouch-action");

    var testElement = $("#container");

    this.setTestElement(testElement);

    this.columnChooserView._isWinDevice = function() {
        return false;
    };

    this.renderColumnChooser();

    this.clock.tick(1000);
    this.columnChooserController.renderShowColumnChooserButton(testElement);
    testElement.find(".dx-datagrid-column-chooser-button").trigger("dxclick"); //show

    assert.ok(!$(document.body).hasClass("dx-datagrid-notouch-action"), "no touch css class");
});

QUnit.test("Remove non touch class when column chooser is hidden on win phone", function(assert) {
    //arrange
    var testElement = $("#container"),
        columnChooser;

    this.setTestElement(testElement);

    this.columnChooserView._isWinDevice = function() {
        return true;
    };

    this.renderColumnChooser();

    this.clock.tick(1000);
    this.columnChooserController.renderShowColumnChooserButton(testElement);
    testElement.find(".dx-datagrid-column-chooser-button").trigger("dxclick"); //show

    columnChooser = $("body").children(".dx-datagrid-column-chooser");
    columnChooser.find(".dx-closebutton").first().trigger("dxclick"); //hide
    this.clock.tick(500);

    //act
    assert.notOk($(document.body).hasClass("dx-datagrid-notouch-action"), "no touch css class");
});

QUnit.test("Show column chooser via api method when it is disabled_T102451", function(assert) {
    //arrange
    var testElement = $("#container"),
        columnChooserView = this.columnChooserView;

    this.setTestElement(testElement);

    this.options.columnChooser = {
        enabled: false
    };

    this.renderColumnChooser();

    //act
    columnChooserView.showColumnChooser();

    //assert
    assert.ok(columnChooserView._popupContainer);
    assert.ok(columnChooserView._isPopupContainerShown, "Column chooser is shown");
});

QUnit.test("Popup window is not initialized when enabled is false_T102451", function(assert) {
    //arrange
    var testElement = $("#container"),
        columnChooserView = this.columnChooserView;

    this.setTestElement(testElement);

    this.options.columnChooser = {
        enabled: false
    };

    columnChooserView.render(testElement);

    //assert
    assert.ok(!columnChooserView._popupContainer);
    assert.ok(!columnChooserView._isPopupContainerShown);
});

//T117339
QUnit.test("Not allow dragging when no visible column chooser", function(assert) {
    //arrange
    var testElement = $("#container"),
        columnChooserView = this.columnChooserView;

    this.setTestElement(testElement);

    this.renderColumnChooser();

    //act, assert
    assert.ok(!columnChooserView.allowDragging({ allowHiding: true }), "not allow dragging");
});

//T117339
QUnit.test("Not allow dragging when allowHiding in column false", function(assert) {
    //arrange
    var testElement = $("#container"),
        columnChooserView = this.columnChooserView;

    this.setTestElement(testElement);

    this.renderColumnChooser();

    columnChooserView._popupContainer.option("visible", true);

    //act, assert
    assert.ok(!columnChooserView.allowDragging({ allowHiding: false }), "not allow dragging");
});

//T117339
QUnit.test("Allow dragging when visible column chooser", function(assert) {
    //arrange
    var testElement = $("#container"),
        columnChooserView = this.columnChooserView;

    this.setTestElement(testElement);

    this.renderColumnChooser();

    columnChooserView._popupContainer.option("visible", true);

    //act, assert
    assert.ok(columnChooserView.allowDragging({ allowHiding: true }), "allow dragging");
});

QUnit.test("Allow dragging with visible band column", function(assert) {
    //arrange
    var $testElement = $("#container"),
        columnChooserView = this.columnChooserView;

    this.setTestElement($testElement);

    this.renderColumnChooser();

    columnChooserView._popupContainer.option("visible", true);

    //act, assert
    assert.ok(columnChooserView.allowDragging({ allowHiding: true, visible: false }, "columnChooser"), "allow dragging");
});

QUnit.test("Not allow dragging with hidden band column", function(assert) {
    //arrange
    var $testElement = $("#container"),
        columnChooserView = this.columnChooserView;

    this.setTestElement($testElement);

    this.renderColumnChooser();

    columnChooserView._columnsController.isParentColumnVisible = function() {
        return false;
    };
    columnChooserView._popupContainer.option("visible", true);

    //act, assert
    assert.ok(!columnChooserView.allowDragging({ allowHiding: true, visible: false }, "columnChooser"), "not allow dragging");
});

QUnit.test("CheckBox mode - not update treeview when selected items", function(assert) {
    //arrange
    var $testElement = $("#container"),
        callRenderColumnChooser,
        columnChooserView = this.columnChooserView;

    this.options.columnChooser.mode = "select";
    $.extend(this.columns, [{ caption: "Column 1", index: 0, visible: true, showInColumnChooser: true }, { caption: "Column 2", index: 1, visible: true, showInColumnChooser: true }]);
    this.setTestElement($testElement);

    this.renderColumnChooser();
    columnChooserView._columnsController.columnOption = function(columnIndex, optionName, value) {
        if(!commonUtils.isDefined(value)) {
            return;
        }

        //assert
        assert.equal(columnIndex, 0, "column index");
        assert.strictEqual(optionName, "visible", "option name is 'visible'");
        assert.ok(!value, "value of the option");
        this.columnsChanged.fire({ optionNames: {} });
    };
    columnChooserView._popupContainer.option("visible", true);
    columnChooserView._renderColumnChooserList = function() {
        callRenderColumnChooser = true;
    };

    //act
    $("body").children(".dx-datagrid-column-chooser").find(".dx-checkbox").first().trigger("dxclick");
    this.clock.tick(500);

    //assert
    assert.ok(!callRenderColumnChooser, "not update treeview");
});

QUnit.test("CheckBox mode - update treeview when changed the column option is showInColumnChooser", function(assert) {
    //arrange
    var $testElement = $("#container"),
        callRenderColumnChooser,
        columnChooserView = this.columnChooserView;

    this.options.columnChooser.mode = "select";
    $.extend(this.columns, [{ caption: "Column 1", index: 0, visible: true, showInColumnChooser: true }, { caption: "Column 2", index: 1, visible: true, showInColumnChooser: true }]);
    this.setTestElement($testElement);

    this.renderColumnChooser();
    columnChooserView._popupContainer.option("visible", true);
    columnChooserView._renderColumnChooserList = function() {
        callRenderColumnChooser = true;
    };

    //act
    columnChooserView._columnsController.columnsChanged.fire({ optionNames: { showInColumnChooser: true } });

    //assert
    assert.ok(callRenderColumnChooser, "not update treeview");
});

QUnit.test("CheckBox mode - column chooser with hidden band column", function(assert) {
    //arrange
    var $testElement = $("#container"),
        $checkBoxElements,
        columnChooserView = this.columnChooserView;

    this.options.columnChooser.mode = "select";
    $.extend(this.columns, [{ caption: "Band Column", index: 0, visible: false, showInColumnChooser: true }, { caption: "Column 1", index: 1, visible: true, showInColumnChooser: true, ownerBand: 0 }, { caption: "Column 2", index: 2, visible: false, showInColumnChooser: true, ownerBand: 0 }]);
    this.setTestElement($testElement);

    columnChooserView._columnsController.isParentColumnVisible = function() {
        return false;
    };

    //act
    this.renderColumnChooser();
    columnChooserView._popupContainer.option("visible", true);

    //assert
    $checkBoxElements = columnChooserView._popupContainer.content().find(".dx-checkbox");
    assert.equal($checkBoxElements.length, 3, "count checkbox");
    assert.ok(!$checkBoxElements.eq(0).hasClass("dx-checkbox-checked"), "checkbox isn't checked");
    assert.ok($checkBoxElements.eq(1).hasClass("dx-checkbox-checked"), "checkbox is checked");
    assert.ok(!$checkBoxElements.eq(2).hasClass("dx-checkbox-checked"), "checkbox is checked");
});

QUnit.test("CheckBox mode - check hidden band column", function(assert) {
    //arrange
    var that = this,
        $testElement = $("#container"),
        $checkBoxElements,
        columnChooserView = this.columnChooserView;

    this.options.columnChooser.mode = "select";
    $.extend(this.columns, [{ caption: "Band Column", index: 0, visible: false, showInColumnChooser: true }, { caption: "Column 1", index: 1, visible: true, showInColumnChooser: true, ownerBand: 0 }, { caption: "Column 2", index: 2, visible: false, showInColumnChooser: true, ownerBand: 0 }]);
    this.setTestElement($testElement);

    columnChooserView._columnsController.isParentColumnVisible = function(columnIndex) {
        return that.columns[0].visible;
    };

    //act
    this.renderColumnChooser();
    columnChooserView._popupContainer.option("visible", true);

    columnChooserView._popupContainer.content().find(".dx-checkbox").first().trigger("dxclick");


    //assert
    $checkBoxElements = columnChooserView._popupContainer.content().find(".dx-checkbox");
    assert.equal($checkBoxElements.length, 3, "count checkbox");
    assert.ok($checkBoxElements.eq(0).hasClass("dx-checkbox-checked"), "checkbox is checked");
    assert.ok($checkBoxElements.eq(1).hasClass("dx-checkbox-checked"), "checkbox is checked");
    assert.ok(!$checkBoxElements.eq(2).hasClass("dx-checkbox-checked"), "checkbox isn't checked");
});

QUnit.test("CheckBox mode - Update a selection state when column visibility is changed via API", function(assert) {
    //arrange
    var $testElement = $("#container");

    this.options.columnChooser.mode = "select";
    $.extend(this.columns, [{ caption: "Column 1", index: 0, visible: true, showInColumnChooser: true }, { caption: "Column 2", index: 1, visible: true, showInColumnChooser: true }]);
    this.setTestElement($testElement);

    //act
    this.columnChooserView.showColumnChooser();
    this.clock.tick(1000);

    this.columnsController.columnOption(0, "visible", false);
    this.columnsController.columnsChanged.fire({
        columnIndex: 0,
        optionNames: {
            visible: true
        }
    });

    //assert
    assert.ok(!this.columnChooserView._columnChooserList.getNodes()[0].selected, "first item is not selected");

    this.columnChooserView.hideColumnChooser();
});

QUnit.test("CheckBox mode - scroll position after selecting an last item", function(assert) {
    //arrange
    var $columnChooser,
        $lastItemElement,
        scrollableInstance,
        $testElement = $("#container");

    this.options.columnChooser.mode = "select";
    this.options.columnChooser.height = 200;
    this.columns.push(
        { caption: "Column 1", index: 0, visible: true, showInColumnChooser: true },
        { caption: "Column 2", index: 1, visible: true, showInColumnChooser: true },
        { caption: "Column 3", index: 2, visible: true, showInColumnChooser: true },
        { caption: "Column 4", index: 3, visible: true, showInColumnChooser: true },
        { caption: "Column 5", index: 4, visible: true, showInColumnChooser: true },
        { caption: "Column 6", index: 5, visible: true, showInColumnChooser: true },
        { caption: "Column 7", index: 6, visible: true, showInColumnChooser: true },
        { caption: "Column 8", index: 7, visible: true, showInColumnChooser: true }
    );

    this.setTestElement($testElement);
    this.columnChooserView.showColumnChooser();
    this.clock.tick(1000);

    $columnChooser = $("body").children(".dx-datagrid-column-chooser");
    $lastItemElement = $columnChooser.find(".dx-treeview-item").last();
    scrollableInstance = $columnChooser.find(".dx-scrollable").data("dxScrollable");
    scrollableInstance.scrollToElement($lastItemElement);

    //act
    this.columnsController.columnOption(7, "visible", false);
    this.columnChooserView.render($testElement, true);

    //assert
    scrollableInstance = $columnChooser.find(".dx-scrollable").data("dxScrollable");
    assert.ok(scrollableInstance.scrollTop() > 0, "scroll position");
});
