/*global define*/
define([
        '../Core/buildModuleUrl',
        '../Core/defineProperties',
        '../Core/destroyObject',
        './PostProcess',
        './PostProcessCompositeStage',
        './PostProcessStage',
        '../Shaders/PostProcessFilters/FXAA',
        '../ThirdParty/Shaders/FXAA3_11'
], function(
        buildModuleUrl,
        defineProperties,
        destroyObject,
        PostProcess,
        PostProcessCompositeStage,
        PostProcessStage,
        FXAAFS,
        FXAA3_11) {
    'use strict';

    function PostProcessLibrary() {
        this.blackAndWhite = createBlackAndWhiteStage();
        this.brightness = createBrightnessStage();
        this.eightBit = createEightBitStage();
        this.textureOverlay = createTextureOverlayStage();
        this.nightVision = createNightVisionStage();
        this.fxaa = createFxaaStage();
    }

    function createBlackAndWhiteStage() {
        var uniformValues = {
            gradations : 5.0
        };

        var fragmentShader =
            'uniform sampler2D u_colorTexture; \n' +
            'uniform float u_gradations; \n' +
            'varying vec2 v_textureCoordinates; \n' +
            'void main(void) \n' +
            '{ \n' +
            '    vec3 rgb = texture2D(u_colorTexture, v_textureCoordinates).rgb; \n' +
            '    float luminance = czm_luminance(rgb); \n' +
            '    float darkness = luminance * u_gradations; \n' +
            '    darkness = (darkness - fract(darkness)) / u_gradations; \n' +
            '    gl_FragColor = vec4(vec3(darkness), 1.0); \n' +
            '} \n';

        return new PostProcessStage({
            name : 'blackAndWhite',
            fragmentShader : fragmentShader,
            uniformValues : uniformValues
        });
    }

    function createBrightnessStage() {
        var uniformValues = {
            brightness : 0.5
        };

        var fragmentShader =
            'uniform sampler2D u_colorTexture; \n' +
            'uniform float u_brightness; \n' +
            'varying vec2 v_textureCoordinates; \n' +
            'void main(void) \n' +
            '{ \n' +
            '    vec3 rgb = texture2D(u_colorTexture, v_textureCoordinates).rgb; \n' +
            '    vec3 target = vec3(0.0); \n' +
            '    gl_FragColor = vec4(mix(target, rgb, u_brightness), 1.0); \n' +
            '} \n';

        return new PostProcessStage({
            name : 'brightness',
            fragmentShader : fragmentShader,
            uniformValues : uniformValues
        });
    }

    function createEightBitStage() {
        var fragmentShader =
            'uniform sampler2D u_colorTexture; \n' +
            'varying vec2 v_textureCoordinates; \n' +
            'const int KERNEL_WIDTH = 16; \n' +
            'void main(void) \n' +
            '{ \n' +
            '    vec2 u_step = vec2(1.0 / czm_viewport.z, 1.0 / czm_viewport.w); \n' +
            '    vec2 integralPos = v_textureCoordinates - mod(v_textureCoordinates, 8.0 * u_step); \n' +
            '    vec3 averageValue = vec3(0.0); \n' +
            '    for (int i = 0; i < KERNEL_WIDTH; i++) \n' +
            '    { \n' +
            '        for (int j = 0; j < KERNEL_WIDTH; j++) \n' +
            '        { \n' +
            '            averageValue += texture2D(u_colorTexture, integralPos + u_step * vec2(i, j)).rgb; \n' +
            '        } \n' +
            '    } \n' +
            '    averageValue /= float(KERNEL_WIDTH * KERNEL_WIDTH); \n' +
            '    gl_FragColor = vec4(averageValue, 1.0); \n' +
            '} \n';
        return new PostProcessStage({
            name : 'eightBit',
            fragmentShader : fragmentShader
        });
    }

    function createTextureOverlayStage() {
        var url = buildModuleUrl('Assets/Textures/cockpit.png');
        var uniformValues = {
            alpha : 0.5,
            texture : url
        };

        var fragmentShader =
            'uniform sampler2D u_colorTexture; \n' +
            'varying vec2 v_textureCoordinates; \n' +
            'uniform float u_alpha; \n' +
            'uniform sampler2D u_texture; \n' +
            'void main(void) \n' +
            '{ \n' +
            '    vec4 screen = texture2D(u_colorTexture, v_textureCoordinates); \n' +
            '    vec4 color = texture2D(u_texture, v_textureCoordinates); \n' +
            '    gl_FragColor = vec4(mix(screen.rgb, color.rgb, u_alpha * color.a), 1.0); \n' +
            '} \n';

        return new PostProcessStage({
            name : 'textureOverlay',
            fragmentShader : fragmentShader,
            uniformValues : uniformValues
        });
    }

    function createNightVisionStage() {
        var fragmentShader =
            'uniform sampler2D u_colorTexture; \n' +
            'varying vec2 v_textureCoordinates; \n' +
            'float rand(vec2 co) \n' +
            '{ \n' +
            '    return fract(sin(dot(co.xy ,vec2(12.9898, 78.233))) * 43758.5453); \n' +
            '} \n' +
            'void main(void) \n' +
            '{ \n' +
            '    float noiseValue = rand(v_textureCoordinates + sin(czm_frameNumber)) * 0.1; \n' +
            '    vec3 rgb = texture2D(u_colorTexture, v_textureCoordinates).rgb; \n' +
            '    vec3 green = vec3(0.0, 1.0, 0.0); \n' +
            '    gl_FragColor = vec4((noiseValue + rgb) * green, 1.0); \n' +
            '} \n';

        return new PostProcessStage({
            name : 'nightVision',
            fragmentShader : fragmentShader
        });
    }

    function createFxaaStage() {
        var fragmentShader =
            '#define FXAA_QUALITY_PRESET 39 \n' +
            FXAA3_11 + '\n' +
            FXAAFS;
        return new PostProcessStage({
            name : 'fxaa',
            fragmentShader : fragmentShader
        });
    }

    return PostProcessLibrary;
});
