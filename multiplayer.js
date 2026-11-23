const Multi={
  joinTournament(){ document.getElementById('tourStatus').innerText='✅ Joined! Your Rank: #3 | Score to Beat: 15000'; UI.msg('🏆 Tournament Joined!'); },
  createRoom(){ let code='AZIZ'+Math.floor(100+Math.random()*900); document.getElementById('roomCode').value=code; document.getElementById('roomStatus').innerText='Room Created: '+code+' - Share with friends! Waiting for players... (1/4)'; },
  joinRoom(){ let c=document.getElementById('roomCode').value; if(!c) return UI.msg('Room Code likho!'); document.getElementById('roomStatus').innerText='Joined Room '+c+' - Race starts in 3...2...1...'; UI.msg('Joined Room '+c); },
  invite(){ document.getElementById('inviteStatus').innerText='Invite link copied! Share on WhatsApp.'; UI.msg('Invite Sent!'); }
};
