sap.ui.define([
	"be/wl/zcomploaderlib/objects/BaseObject",
	"./Component"
], function (BaseObject, Component) {
	"use strict";
	return BaseObject.extend("be.wl.CompLoaderApp.model.Scenario", {
		constructor: function (data) {
			BaseObject.call(this, data);
			this.id = data.scenario;
			this.startupParameters = data.startupParameters;
			this.components = [];
		},
		setComponents: function (components) {
			this.components = components.map((component) => new Component(component));
		},
		setTitle: function (title) {
			this.title = title;
		},
		addComponent: function (component) {
			this.components.push(new Component(component));
		},
		getNextLevel: function (level) {
			var nextlevel = ++level;
			if (nextlevel <= this.components.length) {
				return nextlevel;
			}
			return false;
		},
		getPreviousLevel: function (level) {
			var nextlevel = --level;
			if (nextlevel > 0) {
				return nextlevel;
			}
			return false;
		},
		hasComponents: function () {
			return this.components && Array.isArray(this.components) && this.components.length > 0;
		},
		getComponent: function (level) {
			return this.components.find((component) => component.getLevel() == level);
		},
		getUIComponentData: function (level) {
			let data;
			if (this.getPreviousComponent(level)) {
				data = this.getPreviousComponent(level).getData();
			}
			return data;
		},
		getUIComponent: function (level) {
			return this.getComponent(level).getUIComponent({
				data: this.getUIComponentData(level),
				level: level,
				startupParameters: this.startupParameters,
				scenario: this.getJSON()
			});
		},
		updateUIComponent: function (level) {
			return this.getComponent(level).updateUIComponentInput({
				data: this.getUIComponentData(level),
				level: level,
				scenario: this.getJSON()
			});
		},
		updateNextUIComponent: function (level) {
			let nextLevel = this.getNextComponent(level).getLevel();
			return this.updateUIComponent(nextLevel);
		},
		getNextComponent: function (level) {
			let nextlevel = this.getNextLevel(level);
			return nextlevel && this.getComponent(nextlevel);
		},
		getPreviousComponent: function (level) {
			let prevlevel = this.getPreviousLevel(level);
			return prevlevel && this.getComponent(prevlevel);
		},
		getComponentIdByLevel: function (level) {
			return this.getComponent(level).getComponentId();
		},
		getRouteByLevel: function (level) {
			return this.getComponent(level).getView();
		},
		getNextComponentRoute: function (level) {
			let nextlevel = this.getNextLevel(level);
			if (nextlevel < this.components.length) {
				return this.getRouteByLevel(nextlevel);
			}
			return false;
		},
		getPreviousComponentRoute: function (level) {
			let prevlevel = this.getPreviousLevel(level);
			if (prevlevel < this.components.length) {
				return this.getRouteByLevel(prevlevel);
			}
			return false;
		},
		getComponents: function () {
			return this.components;
		},
		getJSON: function () {
			let scenario = this.getJSONObject(["id", "type"]);
			scenario.components = this.getComponents().map((component) => component.getJSON());
			return scenario;
		}
	});
});