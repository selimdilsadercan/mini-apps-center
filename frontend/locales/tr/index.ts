import common from "./common.json";
import dailyWeather from "./daily-weather.json";
import tasket from "./tasket.json";
import workplaces from "./workplaces.json";
import pomodoro from "./pomodoro.json";
import landing from "./landing.json";
import tasarruf from "./tasarruf.json";
import surdurulebilirlik from "./surdurulebilirlik.json";
import penaltyJar from "./penalty-jar.json";
import oneDayCityGuide from "./one-day-city-guide.json";

const messages = {
  ...common,
  ...landing,
  dailyWeather,
  tasket,
  workplaces,
  pomodoro,
  ...tasarruf,
  ...surdurulebilirlik,
  penaltyJar,
  oneDayCityGuide,
};

export default messages;
