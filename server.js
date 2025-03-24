const { DateTime } = require('luxon');
const { easter } = require('date-easter');
const express = require('express');
const app = express();
const PORT = 3000;

// Helper: Convert number to ordinal (1st, 2nd, etc.)
function ordinal(n) {
  const suffixes = ["th", "st", "nd", "rd"];
  const remainder = n % 100;
  return n + (suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0]);
}
function parseDateTime(dateStr) {
  return DateTime.fromFormat(dateStr, 'yyyy-MM-dd', { zone: 'America/Edmonton' }).toJSDate();
}
// Parse date string without timezone issues
function parseDate(dateStr) {
  if (!dateStr) return new Date(); // Current date if no input
  
  // Handle YYYY-MM-DD format without timezone shifts
  const [year, month, day] = dateStr.split('-').map(Number);
  console.log("parse date to", year, month, day);
  let mon = month -1;
  let new_date = new Date(`${year}-${mon}-${day}`);
  console.log("new date to", new_date);
  return new_date;
}

// Calculate all liturgical dates for a year
function calculateLiturgicalDates(year) {
  const easterObj = easter(year);
  const easterDate = new Date(easterObj.year, easterObj.month - 1, easterObj.day);
  
  return {
    // Easter cycle
    ashWednesday: new Date(new Date(easterDate).setDate(easterDate.getDate() - 46)),
    holyWeekStart: new Date(new Date(easterDate).setDate(easterDate.getDate() - 7)),
    easter: easterDate,
    pentecost: new Date(new Date(easterDate).setDate(easterDate.getDate() + 49)),
    
    // Christmas cycle
    adventStart: calculateAdventStart(year),
    christmas: new Date(year, 11, 25),
    epiphany: new Date(year, 0, 6)
  };
}

// Calculate Advent start (Sunday closest to Nov 30)
function calculateAdventStart(year) {
  const stAndrew = new Date(year, 10, 30); // Nov 30
  const daysToSunday = (7 - stAndrew.getDay()) % 7;
  return new Date(new Date(stAndrew).setDate(stAndrew.getDate() + daysToSunday));
}

// Main liturgical day calculation
function getLiturgicalDay(dateStr) {
  const date = parseDate(dateStr);
  const year = date.getFullYear();
  const dates = calculateLiturgicalDates(year);
  
  // Determine season
  if (date >= dates.adventStart && date < dates.christmas) {
    return formatAdvent(date, dates.adventStart);
  } else if (date >= dates.christmas && date < dates.epiphany) {
    return formatChristmas(date, dates.christmas);
  } else if (date >= dates.ashWednesday && date < dates.easter) {
    return formatLent(date, dates.ashWednesday, dates.holyWeekStart);
  } else if (date >= dates.easter && date < dates.pentecost) {
    return formatEaster(date, dates.easter);
  } else {
    return formatOrdinaryTime(date, dates.epiphany, dates.ashWednesday, dates.pentecost);
  }
}

// ... (Keep all season formatters from previous implementation)

// Updated Express endpoint
app.get('/liturgical-day', (req, res) => {
  try {
    const result = getLiturgicalDay(req.query.date);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));


