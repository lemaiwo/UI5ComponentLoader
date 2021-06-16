sap.ui.define([
	"be/wl/zcomploaderlib/objects/BaseObject"
], function (BaseObject) {
	"use strict";
	return BaseObject.extend("be.wl.CompLoaderApp.model.Param", {
		constructor: function (data) {
			BaseObject.call(this, data);
		},
		getConvertedValue: function () {
			switch (this.value) {
			case "true":
				return true;
			case "false":
				return false;
			default:
				if (isNaN(this.value)) {
					return this.value;
				} else {
					return Number(this.value);
				}
			}
		},
		getJSON: function () {
			return this.getJSONObject(["id", "value"]);
		}
	});
});