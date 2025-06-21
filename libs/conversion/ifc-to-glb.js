const { IFCManager } = require('web-ifc');
const fs = require('fs');

async function convertIfcToGlb(ifcPath, glbPath) {
  const manager = new IFCManager();
  await manager.OpenModel(ifcPath);
  const glbBuffer = await manager.SaveModelAsGLB();
  fs.writeFileSync(glbPath, glbBuffer);
  await manager.CloseModel();
}

module.exports = { convertIfcToGlb };
