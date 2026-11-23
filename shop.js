const Shop={
  items:[
    {name:'Hoverboard', price:200, icon:'🛹', desc:'Fly over trains'},
    {name:'Coin Magnet', price:150, icon:'🧲', desc:'Coins auto collect'},
    {name:'Super Shoes', price:100, icon:'👟', desc:'Higher Jump'},
    {name:'Golden Outfit', price:300, icon:'👑', desc:'Premium Skin'},
    {name:'2X Score', price:250, icon:'⚡', desc:'Double Score 30s'},
    {name:'Shield', price:180, icon:'🛡️', desc:'Save from 1 crash'},
    {name:'Jetpack', price:400, icon:'🚀', desc:'+500 Distance'},
    {name:'Mystery Box', price:120, icon:'🎁', desc:'Random Reward'},
  ],
  render(){
    document.getElementById('shopList').innerHTML=this.items.map((it,i)=>`
      <div class="shopItem"><div><b>${it.icon} ${it.name}</b><br><small>${it.desc}</small></div>
      <button onclick="Shop.buy(${i})">${DB.owned.includes(it.name)?'OWNED ✅':it.price+' Coins'}</button></div>`).join('');
  },
  buy(i){
    let it=this.items[i];
    if(DB.owned.includes(it.name)){ this.activate(it.name); return; }
    if(DB.coins>=it.price){ DB.coins-=it.price; DB.owned.push(it.name); DB.history.push(`Bought ${it.name} -${it.price}`); saveDB(); this.render(); this.activate(it.name); UI.msg(it.name+' Unlocked! 🎉'); }
    else UI.msg('Not Enough Coins! Play More');
  },
  activate(name){
    if(name==='Coin Magnet'){ Game.power='magnet'; Game.powerT=600; }
    if(name==='2X Score'){ Game.power='2x'; Game.powerT=600; Game.multi=2; }
    if(name==='Shield'){ Game.shield=true; Game.power='shield'; Game.powerT=600; }
    if(name==='Jetpack'){ Game.dist+=500; UI.msg('🚀 Jetpack! +500m'); }
    if(name==='Super Shoes'){ Game.jumpVel=0.4; UI.msg('👟 Super Jump!'); }
  },
  daily(){ DB.coins+=50; DB.history.push('Daily Reward +50'); saveDB(); UI.msg('🎁 Daily +50 Coins!'); },
  claim(amount,task){ DB.coins+=amount; DB.history.push(`Challenge ${task} +${amount}`); saveDB(); UI.msg(`🎯 Challenge Done! +${amount} Coins`); }
};
