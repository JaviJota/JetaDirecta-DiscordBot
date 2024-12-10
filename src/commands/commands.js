import 'dotenv/config';
import { InstallGlobalCommands } from '../utils/utils.js';

const GREET_COMMAND = {
    name: 'greet',
    description: 'Greeting command',
    type: 1,
    integration_types: [0, 1],
    contexts: [0, 1, 2],
};

const ALL_COMMANDS = [GREET_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS)