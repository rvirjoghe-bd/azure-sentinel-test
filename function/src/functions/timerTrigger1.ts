import {app, InvocationContext, Timer} from '@azure/functions';
import {DefaultAzureCredential} from "@azure/identity";
import {Application} from "./lib/application";

const credential = new DefaultAzureCredential();

export async function timerTrigger1(timer: Timer, context: InvocationContext): Promise<void> {
    context.log(`START`);
    await Application.getInstance(credential).run(context);
    context.log(`STOP`);
}

app.timer('timerTrigger1', {
    schedule: '0 */5 * * * *',
    handler: timerTrigger1,
    useMonitor: true
});