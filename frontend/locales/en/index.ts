import common from "./common.json";
import tasket from "./tasket.json";
import workplaces from "./workplaces.json";
import pomodoro from "./pomodoro.json";
import landing from "./landing.json";
import tasarruf from "./tasarruf.json";

const messages = {
  ...common,
  ...landing,
  tasket,
  workplaces,
  pomodoro,
  ...tasarruf,
};

export default messages;
