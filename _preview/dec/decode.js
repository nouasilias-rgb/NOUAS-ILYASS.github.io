const fs = require('fs')
const path = require('path')
const draco3d = require('draco3d')

const root = path.resolve(__dirname, '../..')
const gltf = JSON.parse(fs.readFileSync(path.join(root, 'static/models/ramenShop/glTF/ramenShop.gltf'), 'utf8'))
const bin = Buffer.from(gltf.buffers[0].uri.split(',')[1], 'base64')

async function main() {
  const mod = await draco3d.createDecoderModule({})
  const decoder = new mod.Decoder()

  const targets = { jZhouPink: 32, jZhouBlack: 41, projectsWhite: 40, projectsRed: 34, jesseZhouJoined: 1 }

  const out = {}
  for (const [name, nodeIndex] of Object.entries(targets)) {
    const node = gltf.nodes[nodeIndex]
    const prim = gltf.meshes[node.mesh].primitives[0]
    const ext = prim.extensions.KHR_draco_mesh_compression
    const bv = gltf.bufferViews[ext.bufferView]
    const offset = bv.byteOffset || 0
    const data = bin.slice(offset, offset + bv.byteLength)

    const buf = new mod.DecoderBuffer()
    buf.Init(new Int8Array(data), data.length)
    const mesh = new mod.Mesh()
    decoder.DecodeBufferToMesh(buf, mesh)

    const posAttr = decoder.GetAttributeByUniqueId(mesh, ext.attributes.POSITION)
    const n = mesh.num_points()
    const arr = new Float32Array(n * 3)
    const da = new mod.DracoFloat32Array()
    decoder.GetAttributeFloatForAllPoints(mesh, posAttr, da)
    for (let i = 0; i < n * 3; i++) arr[i] = da.GetValue(i)

    const numFaces = mesh.num_faces()
    const ia = new mod.DracoInt32Array()
    const tris = []
    for (let f = 0; f < numFaces; f++) {
      decoder.GetFaceFromMesh(mesh, f, ia)
      const t = []
      for (let k = 0; k < 3; k++) {
        const i = ia.GetValue(k)
        t.push([arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2]])
      }
      tris.push(t)
    }
    out[name] = tris
    console.log(name, 'verts', n, 'faces', numFaces)
  }
  fs.writeFileSync(path.join(__dirname, 'tris.json'), JSON.stringify(out))
}
main().catch(e => { console.error(e); process.exit(1) })
