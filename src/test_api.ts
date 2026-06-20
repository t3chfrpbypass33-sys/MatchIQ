async function main() {
  try {
    const token = '8851391eaade2e6388777a5f27a5b3f5747d6882';
    const url = 'https://sports.bzzoiro.com/api/v2/events/?team_name=Argentina';
    const res = await fetch(url, {
      headers: { 'Authorization': `Token ${token}` }
    });
    const data = await res.json();
    console.log('Argentina matches with France:');
    (data.results || []).forEach((e: any) => {
      if (e.home_team.includes('France') || e.away_team.includes('France')) {
        console.log(`- ID: ${e.id}, Date: ${e.event_date}, ${e.home_team} vs ${e.away_team}, status: ${e.status}, score: ${e.home_score}-${e.away_score}`);
      }
    });
  } catch (err) {
    console.error(err);
  }
}
main();
