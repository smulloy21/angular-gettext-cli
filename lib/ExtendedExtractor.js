var util = require('util');
var _ = require('lodash');
var Extractor = require('angular-gettext-tools').Extractor;

function ExtendedExtractor(options) {
    Extractor.call(this, options);
    
    this.options.extensions.json = 'json';
    
    if (_.isString(this.options.jsonProperties)) {
        this.options.jsonProperties = [this.options.jsonProperties];
    }
    else if (!_.isArray(this.options.jsonProperties)) {
        this.options.jsonProperties = [];
    }
}

util.inherits(ExtendedExtractor, Extractor);

ExtendedExtractor.prototype.parse = function (filename, content) {
    var extension = filename.split('.').pop();

    if (this.isSupportedByStrategy('html', extension)) {
        this.extractHtml(filename, content);
    }
    if (this.isSupportedByStrategy('js', extension)) {
        this.extractJs(filename, content);
    }
    if (this.isSupportedByStrategy('json', extension)) {
        this.extractJson(filename, content);
    }
};

ExtendedExtractor.prototype.extractJson = function(filename, src) {
    var that = this;
    var possibleProperties = this.options.jsonProperties;
    
    extractJson(src, 0);
    
    function extractJson(src, lineNumber) {
        var json = JSON.parse(src);
        
        _.forEach(json, extract);
        
        function extract(value, key) {
            var index = src.indexOf(key);
            
            if (_.isArray(value) || _.isObject(value)) {
                extractJson(JSON.stringify(value, null, '\t'), lineNumber + newlines(index).length);
            }
            
            if (_.includes(possibleProperties, key) && _.isString(value)) {
                that.addString(reference(index), value);
            }
        }
        
        function newlines(index) {
            return src.substr(0, index).match(/\n/g) || [];
        }
        
        function reference(index) {
            return {
                file: filename,
                location: {
                    start: {
                        line: lineNumber + newlines(index).length + 1
                    }
                }
            };
        }
    }
};

module.exports = ExtendedExtractor;
