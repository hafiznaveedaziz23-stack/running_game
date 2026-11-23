// ===== RUNNING RUSH 3D - GAME ENGINE =====
let DB = JSON.parse(localStorage.getItem('rr_db')||'{}');
if(!DB.coins) DB={coins:0,best:0,runs:0,dist:0,wins:0,owned:[],history:[],ach:[],name:'Naveed',id:'RR-'+Math.floor(1000+Math.random()*9000)};
function saveDB(){ localStorage.setItem('rr_db',JSON.stringify(DB)); UI.update(); }
const UI={
  update(){
    ['menuCoins','totalCoins','shopCoins','pCoins'].forEach(id=>{let e=document.getElementById(id); if(e) e.innerText=DB.coins;});
    ['menuBest','pBest','best'].forEach(id=>{let e=document.getElementById(id); if(e) e.innerText=DB.best;});
    document.getElementById('totalRuns').innerText=DB.runs;
    document.getElementById('totalDist').innerText=Math.floor(DB.dist)+'m';
    document.getElementById('playerId').innerText=DB.id;
    document.getElementById('pId').innerText=DB.id; document.getElementById('pName').innerText=DB.name;
    document.getElementById('pDist').innerText=Math.floor(DB.dist)+'m'; document.getElementById('pRuns').innerText=DB.runs;
    document.getElementById('pWins').innerText=DB.wins; document.getElementById('pOwned').innerText=DB.owned.join(', ')||'None';
    document.getElementById('pAch').innerText=DB.ach.join(', ')||'New Runner';
    document.getElementById('history').innerHTML=DB.history.slice(-10).reverse().map(h=>`<div>${h}</div>`).join('')||'No transactions yet';
  },
  show(which){
    ['menu','shop','multi','leader','challenges','profile'].forEach(id=>document.getElementById(id).style.display='none');
    document.getElementById('over').style.display='none';
    if(which==='menu'){ document.getElementById('menu').style.display='flex'; document.getElementById('hud').style.display='none'; document.getElementById('controls').style.display='none'; document.getElementById('pauseBtn').style.display='none'; }
    else document.getElementById(which).style.display='block';
    if(which==='leader') UI.leader();
    if(which==='challenges') UI.challenges();
    if(which==='shop') Shop.render();
  },
  msg(t){ let m=document.getElementById('msg'); m.innerText=t; m.style.display='block'; setTimeout(()=>m.style.display='none',1800); },
  leader(){
    let list=[{n:DB.name||'You',s:DB.best},{n:'Ali',s:12450},{n:'Sara',s:9800},{n:'Ayan',s:8700},{n:'Bilal',s:7200}].sort((a,b)=>b.s-a.s);
    document.getElementById('leaderList').innerHTML=list.map((p,i)=>`<div class="card">#${i+1} ${p.n} - <b>${p.s}</b> pts ${i===0?'🏆':''}</div>`).join('');
  },
  challenges(){
    let ch=[{t:'Collect 50 Coins',r:100,cur:DB.coins},{t:'Run 1000m',r:150,cur:Math.floor(DB.dist)},{t:'Score 5000',r:200,cur:DB.best}];
    document.getElementById('challengeList').innerHTML=ch.map(c=>`<div class="card"><b>${c.t}</b><p>Progress: ${c.cur} | Reward: ${c.r} Coins</p><button class="btn" onclick="Shop.claim(${c.r},'${c.t}')">CLAIM</button></div>`).join('');
  }
};

const Game={
  scene:null,camera:null,renderer:null,player:null,police:null,dog:null,
  lanes:[-2.5,0,2.5],lane:1,targetX:0,obstacles:[],coins:[],speed:0.45,score:0,coinCount:0,dist:0,active:false,jumpY:0,jumpVel:0,sliding:false,slideT:0,power:null,powerT:0,multi:1,shield:false,
  init(){
    this.scene=new THREE.Scene(); this.scene.background=new THREE.Color(0x87CEEB); this.scene.fog=new THREE.Fog(0x87CEEB,30,90);
    this.camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,0.1,200); this.camera.position.set(0,5.2,7.5);
    this.renderer=new THREE.WebGLRenderer({antialias:true}); this.renderer.setSize(innerWidth,innerHeight); this.renderer.shadowMap.enabled=true;
    document.getElementById('game').appendChild(this.renderer.domElement);
    this.scene.add(new THREE.AmbientLight(0xffffff,0.85));
    let sun=new THREE.DirectionalLight(0xffffff,0.9); sun.position.set(5,10,5); this.scene.add(sun);
    for(let i=0;i<22;i++){
      let g=new THREE.Mesh(new THREE.BoxGeometry(9,0.2,10), new THREE.MeshLambertMaterial({color:0x555555})); g.position.set(0,-0.1,-i*10); this.scene.add(g);
      [-2.5,0,2.5].forEach(x=>{ let r=new THREE.Mesh(new THREE.BoxGeometry(0.15,0.1,10), new THREE.MeshLambertMaterial({color:0xaaaaaa})); r.position.set(x,0.05,-i*10); this.scene.add(r); });
      for(let s=0;s<4;s++){ let sl=new THREE.Mesh(new THREE.BoxGeometry(7.5,0.05,0.6), new THREE.MeshLambertMaterial({color:0x6b4a2f})); sl.position.set(0,0,-i*10+s*2.5); this.scene.add(sl); }
    }
    for(let i=0;i<30;i++){ let h=Math.random()*8+4; let b=new THREE.Mesh(new THREE.BoxGeometry(4,h,4), new THREE.MeshLambertMaterial({color:new THREE.Color().setHSL(Math.random(),0.4,0.5)})); b.position.set(i%2==0?-9:9,h/2,-i*7); this.scene.add(b); }
    // PLAYER - Human Model
    let grp=new THREE.Group(); let skin=new THREE.MeshLambertMaterial({color:0xffc9a3}), shirt=new THREE.MeshLambertMaterial({color:0x2196F3}), pants=new THREE.MeshLambertMaterial({color:0x222222});
    let head=new THREE.Mesh(new THREE.SphereGeometry(0.45,16,16),skin); head.position.y=2.1; grp.add(head);
    let hair=new THREE.Mesh(new THREE.SphereGeometry(0.48,16,16,0,Math.PI*2,0,1.4), new THREE.MeshLambertMaterial({color:0x111111})); hair.position.y=2.25; grp.add(hair);
    let body=new THREE.Mesh(new THREE.BoxGeometry(0.9,1.1,0.5),shirt); body.position.y=1.25; grp.add(body);
    let legL=new THREE.Mesh(new THREE.BoxGeometry(0.35,0.9,0.35),pants); legL.position.set(-0.25,0.45,0); legL.name='legL'; grp.add(legL);
    let legR=new THREE.Mesh(new THREE.BoxGeometry(0.35,0.9,0.35),pants); legR.position.set(0.25,0.45,0); legR.name='legR'; grp.add(legR);
    let armL=new THREE.Mesh(new THREE.BoxGeometry(0.25,0.9,0.25),shirt); armL.position.set(-0.6,1.3,0); grp.add(armL);
    let armR=new THREE.Mesh(new THREE.BoxGeometry(0.25,0.9,0.25),shirt); armR.position.set(0.6,1.3,0); grp.add(armR);
    this.scene.add(grp); this.player=grp;
    // POLICE + DOG
    let pg=new THREE.Group(); let pb=new THREE.Mesh(new THREE.BoxGeometry(0.9,1.1,0.5), new THREE.MeshLambertMaterial({color:0x0d47a1})); pb.position.y=1.25; pg.add(pb);
    let ph=new THREE.Mesh(new THREE.SphereGeometry(0.45,16,16),skin); ph.position.y=2.1; pg.add(ph);
    let cap=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.2,0.7), new THREE.MeshLambertMaterial({color:0x000000})); cap.position.y=2.5; pg.add(cap);
    pg.position.set(0,0,5); this.scene.add(pg); this.police=pg;
    let dg=new THREE.Group(); let db=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.4,0.5), new THREE.MeshLambertMaterial({color:0x8D6E63})); db.position.y=0.6; dg.add(db);
    let dh=new THREE.Mesh(new THREE.SphereGeometry(0.3,12,12), new THREE.MeshLambertMaterial({color:0x8D6E63})); dh.position.set(0,0.9,0.5); dg.add(dh);
    dg.position.set(0.8,0,5.5); this.scene.add(dg); this.dog=dg;
    this.loop();
  },
  spawn(z){
    let t=Math.random(), m;
    if(t<0.4){ m=new THREE.Mesh(new THREE.BoxGeometry(2.2,3.2,12), new THREE.MeshLambertMaterial({color:0xFF5722})); m.position.set(this.lanes[Math.floor(Math.random()*3)],1.6,z); m.userData.type='train'; }
    else if(t<0.7){ m=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.0,0.5), new THREE.MeshLambertMaterial({color:0xFFC107})); m.position.set(this.lanes[Math.floor(Math.random()*3)],0.5,z); m.userData.type='barrier'; }
    else { m=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.2,0.8), new THREE.MeshLambertMaterial({color:0x9E9E9E})); m.position.set(this.lanes[Math.floor(Math.random()*3)],2.2,z); m.userData.type='overhead'; }
    this.scene.add(m); this.obstacles.push(m);
  },
  spawnCoins(z){ let geo=new THREE.TorusGeometry(0.4,0.15,8,16), mat=new THREE.MeshLambertMaterial({color:0xFFD700}); for(let i=0;i<5;i++){ let c=new THREE.Mesh(geo,mat); c.position.set(this.lanes[Math.floor(Math.random()*3)],1.2,z-i*2); c.rotation.y=1.5; this.scene.add(c); this.coins.push(c); } },
  lastSpawn:0,
  loop(){
    requestAnimationFrame(()=>this.loop());
    let time=Date.now()*0.001;
    if(this.active){
      let legL=this.player.getObjectByName('legL'), legR=this.player.getObjectByName('legR');
      if(legL){ legL.rotation.x=Math.sin(time*18)*0.7; legR.rotation.x=-Math.sin(time*18)*0.7; }
      this.speed+=0.0003; this.dist+=this.speed; this.score=Math.floor(this.dist*2)+this.coinCount*10*this.multi;
      document.getElementById('score').innerText=this.score; document.getElementById('coins').innerText=this.coinCount;
      this.obstacles.forEach(o=>o.position.z+=this.speed*1.8);
      this.coins.forEach(c=>{ c.position.z+=this.speed*1.8; c.rotation.y+=0.1; if(this.power==='magnet' && Math.abs(c.position.z)<9) c.position.x+=(this.player.position.x-c.position.x)*0.2; });
      if(this.dist-this.lastSpawn>25){ this.lastSpawn=this.dist; this.spawn(-80); if(Math.random()<0.7) this.spawnCoins(-75); if(Math.random()<0.08) this.spawnPower(-70); }
      if(this.jumpY>0 || this.jumpVel>0){ this.jumpY+=this.jumpVel; this.jumpVel-=0.015; if(this.jumpY<=0){this.jumpY=0; this.jumpVel=0;} this.player.position.y=this.jumpY; }
      if(this.sliding){ this.slideT--; this.player.scale.y=0.6; if(this.slideT<=0){this.sliding=false; this.player.scale.y=1;} }
      this.player.position.x+=(this.targetX-this.player.position.x)*0.18;
      this.camera.position.x=this.player.position.x*0.6; this.camera.position.y=5.2+this.player.position.y*0.4; this.camera.lookAt(this.player.position.x,1.5,0);
      this.police.position.x+=(this.player.position.x-this.police.position.x)*0.05; this.police.position.y=Math.abs(Math.sin(time*12))*0.2;
      this.dog.position.x+=(this.player.position.x-this.dog.position.x)*0.08; this.dog.position.y=Math.abs(Math.sin(time*18))*0.15;
      // Collision
      this.obstacles.forEach(o=>{
        if(Math.abs(o.position.z)<1 && Math.abs(o.position.x-this.player.position.x)<1.2){
          if(this.shield){ this.scene.remove(o); this.shield=false; UI.msg('🛡️ Shield Saved You!'); return; }
          if(o.userData.type==='barrier' && this.player.position.y>0.6) return;
          if(o.userData.type==='overhead' && this.sliding) return;
          this.gameOver(); return;
        }
      });
      this.coins.forEach((c,idx)=>{ if(Math.abs(c.position.z)<1 && Math.abs(c.position.x-this.player.position.x)<1.2){ this.scene.remove(c); this.coins.splice(idx,1); this.coinCount++; } });
      this.obstacles=this.obstacles.filter(o=>{ if(o.position.z>15){this.scene.remove(o); return false;} return true; });
      this.coins=this.coins.filter(c=>{ if(c.position.z>15){this.scene.remove(c); return false;} return true; });
      if(this.power){ this.powerT--; document.getElementById('powerPill').style.display='block'; document.getElementById('powerName').innerText=this.power.toUpperCase(); document.getElementById('powerTime').innerText=Math.ceil(this.powerT/60); if(this.powerT<=0){ this.power=null; this.multi=1; this.shield=false; document.getElementById('powerPill').style.display='none'; } }
    }
    this.renderer.render(this.scene,this.camera);
  },
  spawnPower(z){ let m=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.8,0.8), new THREE.MeshLambertMaterial({color:0x7C4DFF})); m.position.set(this.lanes[Math.floor(Math.random()*3)],1.2,z); m.userData.power=true; this.scene.add(m); this.coins.push(m); },
  move(d){ if(!this.active) return; this.lane=Math.max(0,Math.min(2,this.lane+d)); this.targetX=this.lanes[this.lane]; },
  jump(){ if(!this.active||this.jumpY>0) return; this.jumpVel=0.28; },
  slide(){ if(!this.active) return; this.sliding=true; this.slideT=35; },
  selectChar(el,emoji,name){ document.querySelectorAll('.char').forEach(c=>c.classList.remove('active')); el.classList.add('active'); },
  start(){
    DB.name=document.getElementById('userName').value||'Naveed'; saveDB();
    document.getElementById('menu').style.display='none'; document.getElementById('over').style.display='none';
    document.getElementById('hud').style.display='flex'; document.getElementById('controls').style.display='flex'; document.getElementById('pauseBtn').style.display='block';
    DB.runs++; saveDB(); this.score=0; this.coinCount=0; this.dist=0; this.speed=0.45; this.lane=1; this.targetX=0; this.player.position.set(0,0,0); this.power=null; this.multi=1; this.shield=false;
    this.obstacles.forEach(o=>this.scene.remove(o)); this.obstacles=[]; this.coins.forEach(c=>this.scene.remove(c)); this.coins=[];
    this.active=true; UI.msg('GO! 🏃💨');
  },
  gameOver(){
    if(!this.active) return; this.active=false;
    document.getElementById('finalScore').innerText=this.score; document.getElementById('finalCoins').innerText=this.coinCount; document.getElementById('finalDist').innerText=Math.floor(this.dist)+'m';
    DB.coins+=this.coinCount; DB.dist+=this.dist;
    let isNew=false; if(this.score>DB.best){ DB.best=this.score; isNew=true; DB.wins++; }
    if(this.score>1000 && !DB.ach.includes('Pro Runner')) DB.ach.push('Pro Runner');
    saveDB(); document.getElementById('newBest').style.display=isNew?'block':'none';
    document.getElementById('over').style.display='flex'; document.getElementById('controls').style.display='none';
  },
  revive(){ if(DB.coins>=50){ DB.coins-=50; DB.history.push('Revive -50 Coins'); saveDB(); document.getElementById('over').style.display='none'; document.getElementById('controls').style.display='flex'; this.obstacles=[]; this.active=true; UI.msg('Revived! 💛'); } else UI.msg('Need 50 Coins!'); }
};
document.addEventListener('keydown',e=>{ if(e.key==='ArrowLeft') Game.move(-1); if(e.key==='ArrowRight') Game.move(1); if(e.key==='ArrowUp') Game.jump(); if(e.key==='ArrowDown') Game.slide(); });
let tx=0,ty=0; document.addEventListener('touchstart',e=>{tx=e.touches[0].clientX; ty=e.touches[0].clientY;});
document.addEventListener('touchend',e=>{ let dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty; if(Math.abs(dx)>Math.abs(dy)){ if(dx>30) Game.move(1); if(dx<-30) Game.move(-1);} else { if(dy<-30) Game.jump(); if(dy>30) Game.slide(); }});
document.getElementById('pauseBtn').onclick=()=>{ Game.active=!Game.active; document.getElementById('pauseBtn').innerText=Game.active?'⏸️':'▶️'; };
Game.init(); UI.update();
