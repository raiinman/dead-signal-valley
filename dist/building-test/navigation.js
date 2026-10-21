export function validateGrid(grid){
  if(!grid||!Array.isArray(grid.origin)||grid.origin.length!==2||!grid.origin.every(Number.isFinite)||!Number.isFinite(grid.step)||grid.step<=0||!Number.isInteger(grid.nx)||!Number.isInteger(grid.nz)||grid.nx<1||grid.nz<1||!Array.isArray(grid.cells)||grid.cells.length!==grid.nx*grid.nz||!grid.cells.every(y=>y===null||Number.isFinite(y)))throw new Error('Invalid geometry-derived walk grid.');
  return grid;
}
export function floorAt(grid,x,z){
  const ix=Math.floor((x-grid.origin[0])/grid.step),iz=Math.floor((z-grid.origin[1])/grid.step);
  return ix<0||iz<0||ix>=grid.nx||iz>=grid.nz?null:grid.cells[iz*grid.nx+ix];
}
export function standingHeight(grid,x,z,currentY,radius=.18){
  let height=-Infinity;
  for(const [dx,dz]of [[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius],[radius*.707,radius*.707],[-radius*.707,radius*.707],[radius*.707,-radius*.707],[-radius*.707,-radius*.707]]){
    const y=floorAt(grid,x+dx,z+dz);
    if(y===null||Math.abs(y-currentY)>.3+1e-6)return null;
    height=Math.max(height,y);
  }
  return height;
}
export function move(grid,body,dx,dz){
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/Math.min(.07,grid.step*.4)));
  for(let i=0;i<steps;i++){
    const x=body.x+dx/steps,yx=standingHeight(grid,x,body.z,body.y);
    if(yx!==null){body.x=x;body.y=yx;}
    const z=body.z+dz/steps,yz=standingHeight(grid,body.x,z,body.y);
    if(yz!==null){body.z=z;body.y=yz;}
  }
  return body;
}
