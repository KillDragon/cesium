/*global define*/
define([
        '../Core/Check',
        '../Core/defineProperties'
], function(
        Check,
        defineProperties) {
    'use strict';

    /**
     * @private
     */
    function PostProcessCompositeStage(options) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('options', options);
        Check.typeOf.string('options.stages', options.stages);
        Check.typeOf.number.greaterThan('options.stages.length', options.stages.length, 0);
        //>>includeEnd('debug');

        this._stages = options.stages;
        this.show = true;
    }

    PostProcessCompositeStage.prototype.update = function(frameState) {
        var stages = this._stages;
        var length = stages.length;
        for (var i = 0; i < length; ++i) {
            stages[i].update(frameState);
        }
    };

    defineProperties(PostProcessCompositeStage.prototype, {
        ready : {
            get : function() {
                var stages = this._stages;
                var length = stages.length;
                for (var i = 0; i < length; ++i) {
                    if (!stages[i].ready) {
                        return false;
                    }
                }
                return true;
            }
        }
    });

    return PostProcessCompositeStage;
});
