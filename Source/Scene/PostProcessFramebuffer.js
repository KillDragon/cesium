/*global define*/
define([
        '../Core/Color',
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/destroyObject',
        '../Core/PixelFormat',
        '../Renderer/ClearCommand',
        '../Renderer/Framebuffer',
        '../Renderer/PixelDatatype',
        '../Renderer/Renderbuffer',
        '../Renderer/RenderbufferFormat',
        '../Renderer/RenderState',
        '../Renderer/Sampler',
        '../Renderer/Texture',
        '../Renderer/TextureMagnificationFilter',
        '../Renderer/TextureMinificationFilter',
        '../Renderer/TextureWrap'
], function(
        Color,
        defaultValue,
        defined,
        destroyObject,
        PixelFormat,
        ClearCommand,
        Framebuffer,
        PixelDatatype,
        Renderbuffer,
        RenderbufferFormat,
        RenderState,
        Sampler,
        Texture,
        TextureMagnificationFilter,
        TextureMinificationFilter,
        TextureWrap) {
    'use strict';

    /**
     * @private
     */
    function PostProcessFramebuffer() {
        this._colorTexture = undefined;
        this._depthAttachment = undefined;
        this._fbo = undefined;

        this._clearCommand = new ClearCommand({
            color : new Color(0.0, 0.0, 0.0, 0.0),
            owner : this
        });
    }

    function destroyResources(post) {
        post._fbo = post._fbo && post._fbo.destroy();
        post._colorTexture = post._colorTexture && post._colorTexture.destroy();

        post._fbo = undefined;
        post._colorTexture = undefined;
        post._depthAttachment = undefined;
    }

    PostProcessFramebuffer.prototype.update = function(context, framebuffer) {
        var width = context.drawingBufferWidth;
        var height = context.drawingBufferHeight;

        // Use the depth attachment of the passed in framebuffer
        var depthTexture = framebuffer.depthStencilTexture;
        var depthRenderbuffer = framebuffer.depthStencilRenderbuffer;
        var depthAttachment = defaultValue(depthRenderbuffer, depthTexture);
        var framebufferDirty = depthAttachment !== this._depthAttachment;
        this._depthAttachment = depthAttachment;

        var colorTexture = this._colorTexture;
        var texturesDirty = !defined(colorTexture) || colorTexture.width !== width || colorTexture.height !== height;
        if (texturesDirty) {
            this._colorTexture = this._colorTexture && this._colorTexture.destroy();
            this._colorTexture = new Texture({
                context : context,
                width : width,
                height : height,
                pixelFormat : PixelFormat.RGBA,
                pixelDatatype : PixelDatatype.UNSIGNED_BYTE,
                sampler : new Sampler({
                    wrapS : TextureWrap.CLAMP_TO_EDGE,
                    wrapT : TextureWrap.CLAMP_TO_EDGE,
                    minificationFilter : TextureMinificationFilter.NEAREST,
                    magnificationFilter : TextureMagnificationFilter.NEAREST
                })
            });
        }

        if (!defined(this._fbo) || framebufferDirty || texturesDirty) {
            this._fbo = this._fbo && this._fbo.destroy();
            this._fbo = new Framebuffer({
                context : context,
                colorTextures : [this._colorTexture],
                depthStencilTexture : depthTexture,
                depthStencilRenderbuffer : depthRenderbuffer,
                destroyAttachments : false
            });
            this._clearCommand.framebuffer = this._fbo;
        }
    };

    PostProcessFramebuffer.prototype.clear = function(context) {
        this._clearCommand.execute(context);
    };

    PostProcessFramebuffer.prototype.getFramebuffer = function() {
        return this._fbo;
    };

    PostProcessFramebuffer.prototype.isDestroyed = function() {
        return false;
    };

    PostProcessFramebuffer.prototype.destroy = function() {
        destroyResources(this);
        return destroyObject(this);
    };

    return PostProcessFramebuffer;
});
