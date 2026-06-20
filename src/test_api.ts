async function main() {
  try {
    const token = '8851391eaade2e6388777a5f27a5b3f5747d6882';
    // Let's test filtering with competition ID, season, and dates
    const url = 'https://sports.bzzoiro.com/api/v2/events/?league_id=27&season_id=188&date_from=2026-06-11&date_to=2026-07-19&limit=150';
    console.log(`Querying: ${url}`);
    const res = await fetch(url, {
      headers: { 'Authorization': `Token ${token}` }
    });
    const data = await res.json();
    const results = data.results || [];
    console.log(`Total events returned with filters: ${results.length}`);
    if (results.length > 0) {
      console.log(`First event: ${results[0].id} on ${results[0].event_date}, ${results[0].home_team} vs ${results[0].away_team}`);
      console.log(`Last event: ${results[results.length - 1].id} on ${results[results.length - 1].event_date}, ${results[results.length - 1].home_team} vs ${results[results.length - 1].away_team}`);
    }
  } catch (err) {
    console.error(err);
  }
}
main();
