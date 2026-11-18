import * as THREE from 'three'
import Experience from '../Experience.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { BasisTextureLoader } from 'three/examples/jsm/loaders/BasisTextureLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { parseGIF, decompressFrames } from 'gifuct-js'
import EventEmitter from './EventEmitter.js'

export default class Resources extends EventEmitter
{
    constructor(sources)
    {
        super()

        this.experience = new Experience()
        this.sources = sources
        this.renderer = this.experience.renderer.instance

        this.items = {}
        this.toLoad = this.sources.length
        this.loaded = 0

        this.video = {}
        this.videoTexture = {}
        this.mychromavideotexturematerial = {}

        // Carousel textures are stored at the index of their source, so the
        // slides always appear in the order they are declared in sources.js
        this.carousel1Sources = this.sources.filter((source) => source.path.includes('smallScreen1'))
        this.carousel2Sources = this.sources.filter((source) => source.path.includes('smallScreen2'))
        this.carousel1 = this.carousel1Sources.map(() => null)
        this.carousel2 = this.carousel2Sources.map(() => null)

        // Animated GIF textures (redrawn to their canvas every frame)
        this.gifTextures = []
        this.lastGifUpdate = 0

        this.setLoaders()
        this.startLoading()
    }

    setLoaders()
    {
        this.loaders = {}
        this.loaders.dracoLoader = new DRACOLoader
        // Relative paths keep the loaders working locally, at a domain root
        // and under a GitHub Pages project subpath alike
        this.loaders.dracoLoader.setDecoderPath('draco/')
        this.loaders.gltfLoader = new GLTFLoader()
        this.loaders.gltfLoader.setDRACOLoader(this.loaders.dracoLoader)
        this.loaders.textureLoader = new THREE.TextureLoader()
        this.loaders.cubeTextureLoader = new THREE.CubeTextureLoader()

        this.loaders.basisTextureLoader = new BasisTextureLoader()
        this.loaders.basisTextureLoader.setTranscoderPath('basis/')
        this.loaders.basisTextureLoader.detectSupport( this.renderer )

        this.loaders.KTX2TextureLoader = new KTX2Loader()
        this.loaders.KTX2TextureLoader.setTranscoderPath('basis/')
        this.loaders.KTX2TextureLoader.detectSupport( this.renderer )

    }

    startLoading()
    {
        // Load each source
        for(const source of this.sources)
        {
            if(source.type === 'gltfModel')
            {
                this.loaders.gltfLoader.load(
                    source.path,
                    (file) =>
                    {
                        this.sourceLoaded(source, file)
                    },
                    undefined,
                    (error) =>
                    {
                        this.sourceFailed(source, error)
                    }
                )
            }
            else if(source.type === 'texture')
            {
                this.loaders.textureLoader.load(
                    source.path,
                    (file) =>
                    {
                        // KTX2/baked textures follow the glTF convention; images
                        // authored in normal image orientation opt in with flipY
                        file.flipY = source.flipY === true
                        file.encoding = THREE.sRGBEncoding
                        this.sourceLoaded(source, file)
                        this.addToCarousel(source, file)
                    },
                    undefined,
                    (error) =>
                    {
                        this.sourceFailed(source, error)
                    }
                )
            }

            else if(source.type === 'basisTexture')
            {
                this.loaders.basisTextureLoader.load(
                    source.path,
                    (file) =>
                    {
                        file.encoding = THREE.sRGBEncoding
                        this.sourceLoaded(source, file)
                        this.addToCarousel(source, file)
                    },
                    undefined,
                    (error) =>
                    {
                        this.sourceFailed(source, error)
                    }
                )
            }

            else if(source.type === 'KTX2Texture')
            {
                this.loaders.KTX2TextureLoader.load(
                    source.path,
                    (file) =>
                    {
                        file.encoding = THREE.sRGBEncoding
                        this.sourceLoaded(source, file)
                    },
                    undefined,
                    (error) =>
                    {
                        this.sourceFailed(source, error)
                    }
                )
            }

            else if(source.type === 'videoTexture')
            {
                // A <video> element cannot play a GIF, so GIFs get their own loader
                if(/\.gif$/i.test(source.path))
                {
                    this.loadGifTexture(source)
                }
                else
                {
                    this.video[source.name] = document.createElement('video')

                    this.video[source.name].src = source.path

                    this.video[source.name].muted = true
                    this.video[source.name].playsInline = true
                    this.video[source.name].autoplay = true
                    this.video[source.name].loop = true
                    // this.video[source.name].play()

                    this.videoTexture[source.name] = new THREE.VideoTexture(this.video[source.name])
                    this.videoTexture[source.name].flipY = false
                    this.videoTexture[source.name].minFilter  = THREE.NearestFilter;
                    this.videoTexture[source.name].magFilter  = THREE.NearestFilter;
                    this.videoTexture[source.name].generateMipmaps = false
                    this.videoTexture[source.name].encoding = THREE.sRGBEncoding

                    this.sourceLoaded(source, this.videoTexture[source.name])
                }

            }
        }

    }

    loadGifTexture(source)
    {
        // A <video> element cannot play a GIF and drawing an animated <img> to
        // a canvas only ever captures its first frame, so the GIF frames are
        // decoded here and drawn to the canvas ourselves
        fetch(source.path)
            .then((response) => response.arrayBuffer())
            .then((buffer) => this.setupGifTexture(source, buffer))
            .catch((error) => this.sourceFailed(source, error))
    }

    setupGifTexture(source, buffer)
    {
        const gif = parseGIF(new Uint8Array(buffer))
        const frames = decompressFrames(gif, true)

        if(frames.length === 0)
        {
            this.sourceFailed(source, new Error('GIF has no frames'))
            return
        }

        // The screens are small in the scene, so frames are kept at most 512px
        const sourceWidth = gif.lsd.width
        const sourceHeight = gif.lsd.height
        const scale = Math.min(1, 512 / Math.max(sourceWidth, sourceHeight))
        const width = Math.max(1, Math.round(sourceWidth * scale))
        const height = Math.max(1, Math.round(sourceHeight * scale))

        const workCanvas = document.createElement('canvas')
        workCanvas.width = sourceWidth
        workCanvas.height = sourceHeight
        const workContext = workCanvas.getContext('2d')

        const patchCanvas = document.createElement('canvas')
        const patchContext = patchCanvas.getContext('2d')

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')

        // GIF frames can be partial patches drawn on top of the previous frame,
        // so compose them all once and keep only the downscaled results
        const composedFrames = []
        const delays = []
        let previousFrame = null
        let previousRegion = null

        for(const frame of frames)
        {
            const dims = frame.dims

            if(previousFrame && previousFrame.disposalType === 2)
            {
                workContext.clearRect(previousFrame.dims.left, previousFrame.dims.top, previousFrame.dims.width, previousFrame.dims.height)
            }
            else if(previousFrame && previousFrame.disposalType === 3 && previousRegion)
            {
                workContext.putImageData(previousRegion, previousFrame.dims.left, previousFrame.dims.top)
            }

            if(frame.disposalType === 3)
            {
                previousRegion = workContext.getImageData(dims.left, dims.top, dims.width, dims.height)
            }

            patchCanvas.width = dims.width
            patchCanvas.height = dims.height
            patchContext.putImageData(new ImageData(new Uint8ClampedArray(frame.patch), dims.width, dims.height), 0, 0)
            workContext.drawImage(patchCanvas, dims.left, dims.top)

            context.clearRect(0, 0, width, height)
            context.drawImage(workCanvas, 0, 0, width, height)

            composedFrames.push(context.getImageData(0, 0, width, height))
            delays.push(Math.max(frame.delay, 20))

            // Release the decoded patch, only the composed frames are needed
            frame.patch = null
            previousFrame = frame
        }

        const texture = new THREE.CanvasTexture(canvas)
        texture.flipY = false
        texture.minFilter = THREE.NearestFilter
        texture.magFilter = THREE.NearestFilter
        texture.generateMipmaps = false
        texture.encoding = THREE.sRGBEncoding

        let frameIndex = 0
        let elapsed = 0

        context.putImageData(composedFrames[0], 0, 0)
        texture.needsUpdate = true

        // Mimics the parts of the <video> API used by the rest of the app
        const gifTexture = {
            paused: true,
            currentTime: 0,
            play: () =>
            {
                gifTexture.paused = false
            },
            pause: () =>
            {
                gifTexture.paused = true
            },
            update: (delta) =>
            {
                if(gifTexture.paused) {return}

                elapsed += delta

                while(elapsed >= delays[frameIndex])
                {
                    elapsed -= delays[frameIndex]
                    frameIndex = (frameIndex + 1) % composedFrames.length

                    context.putImageData(composedFrames[frameIndex], 0, 0)
                    texture.needsUpdate = true
                }

                gifTexture.currentTime += delta
            }
        }

        this.video[source.name] = gifTexture
        this.videoTexture[source.name] = texture
        this.gifTextures.push(gifTexture)

        this.sourceLoaded(source, texture)
    }

    playVideos()
    {
        for(const name of Object.keys(this.video))
        {
            this.video[name].play()
        }
    }

    addToCarousel(source, file)
    {
        const index1 = this.carousel1Sources.indexOf(source)
        if(index1 !== -1) {this.carousel1[index1] = file}

        const index2 = this.carousel2Sources.indexOf(source)
        if(index2 !== -1) {this.carousel2[index2] = file}
    }

    update()
    {
        if(this.gifTextures.length === 0) {return}

        // 30fps is enough for the GIFs and avoids uploading a full canvas
        // texture on every single render tick
        const now = performance.now()
        if(now - this.lastGifUpdate < 1000 / 30) {return}
        const delta = Math.min(now - this.lastGifUpdate, 100)
        this.lastGifUpdate = now

        for(const gif of this.gifTextures)
        {
            gif.update(delta)
        }
    }

    sourceLoaded(source, file)
    {
        this.trigger('itemLoaded')


        this.items[source.name] = file
        this.loaded++

        if(this.loaded === this.toLoad)
        {
            this.trigger('ready')
        }
    }

    sourceFailed(source, error)
    {
        // Still count the source as handled, otherwise the preloader never
        // finishes and the whole experience stays hidden behind the loading screen
        console.error(`Failed to load ${source.type} "${source.name}" from ${source.path}`, error)
        this.sourceLoaded(source, null)
    }
}
