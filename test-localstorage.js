// Test script for checking LocalStorage state
console.log('=== LocalStorage Test Check ===');
const gameData = localStorage.getItem('agp_game_data');
console.log('agp_game_data exists:', !!gameData);
if (gameData) {
  try {
    const parsed = JSON.parse(gameData);
    console.log('Game data parsed successfully:', !!parsed);
  } catch (e) {
    console.error('Game data parse error:', e);
  }
} else {
  console.log('No game data found - this should trigger empty state UI');
}
console.log('=== End LocalStorage Check ===');
