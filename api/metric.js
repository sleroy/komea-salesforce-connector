/**
 * Exports the constructor of a metric.
 */
function Metric() {
    this.active = true;
    this.aggregationName = "string";
    this.description = "string";
    this.formula = "string";
    this.frequency = "string";
    this.key = "string";
    this.missingValueStrategy = "string";
    this.name = "string";
    this.otherAttributes = {};
    this.type = "string";
    this.units = "string";
    this.valueDirection = 0;
    this.valueType = "string";
}

module.exports = Metric;

Metric.prototype.lastValue = function() {
  this.aggregationName = "LAST_VALUE";
}

Metric.prototype.oncePerDay= function() {
  this.frequency = "DAILY";
}
