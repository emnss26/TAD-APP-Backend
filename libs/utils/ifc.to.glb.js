const fs = require("fs");
const path = require("path");
const { IfcAPI } = require("web-ifc");
const { Scene } = require("three");
const { GLTFExporter } = require('three/examples/jsm/exporters/GLTFExporter.js');

// Carga y convierte el IFC usando web-ifc y exporta a GLB usando three
async function convertIfcToGlbNode(ifcPath, glbPath) {
  const ifcAPI = new IfcAPI();
  await ifcAPI.Init();
  const buffer = fs.readFileSync(ifcPath);
  const modelID = ifcAPI.OpenModel(buffer);

  // Crea la escena
  const scene = new Scene();

  // Exporta la escena como GLB
  const exporter = new GLTFExporter();
  exporter.parse(
    scene,
    (glb) => {
      if (Buffer.isBuffer(glb)) {
        fs.writeFileSync(glbPath, glb);
      } else if (glb instanceof ArrayBuffer) {
        fs.writeFileSync(glbPath, Buffer.from(glb));
      } else {
        fs.writeFileSync(glbPath, Buffer.from(JSON.stringify(glb)));
      }
    },
    { binary: true }
  );

  ifcAPI.CloseModel(modelID);
}

module.exports = { convertIfcToGlbNode };