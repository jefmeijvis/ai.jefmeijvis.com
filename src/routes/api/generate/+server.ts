import {PRIVATE_CONTAINER_BASE_URL} from '$env/static/private'

const base_url : string = PRIVATE_CONTAINER_BASE_URL + '/api/generate'
let headers = {'content-type': 'text/event-stream'}
let ac = new AbortController();



export async function GET({url}) 
{
    // Get request details
    let model = 'llama2';
    let prompt = url.searchParams.get('prompt') ?? "";

    // Get request init and body
    let body : any = getBody(model,prompt);
    let requestInit = getRequestInit(body,ac.signal);

    ac = new AbortController();
	const readable = new ReadableStream(
    {
            start(controller)
            {
                fetch(base_url,requestInit).then(
                (response) => 
                {
                    //@ts-ignore
                    const reader = response.body.getReader();
                    reader.read().then(function pump({ done, value }) : any
                    {
                        console.log("START PUMP")
                        if(done)
                        {
                            console.log("Request was done")
                            return;
                        }

                        if(ac.signal.aborted)
                        {
                            console.log("Request was already aborted, no need to pump")
                            return;
                        }

                        
                        let reply = new TextDecoder().decode(value);
                        let obj = JSON.parse(reply);

                        let result = {};


                        if(obj.error)
                        {
                            console.log('ERROR RESPONSE FROM CONTAINER: ' + obj.error);
                        }


                        result= 
                        {
                            response : obj.response ?? obj.error ?? "",
                            done : obj.done ?? true,
                            duration : obj.total_duration ?? -1
                        }

                        sendData(controller,result);
                        return reader.read().then(pump);
                    });
                });
            },
            cancel(controller) 
            {
                console.log("START CANCEL")
                if(!ac.signal.aborted)
                    ac.abort();

                console.log("Cancel");
            }
    });

	return new Response(readable, {headers: headers});
}

function getRequestInit(body : any, signal : any) : RequestInit
{
    return {
        method : 'POST',
        body : JSON.stringify(body),
        signal: signal,
    }
}

function getBody(model : string, prompt : string)
{
    return {
        'model' : model,
        'prompt' :  prompt,
    }
}

function sendData(ctr : ReadableStreamDefaultController, data : any)
{
    ctr.enqueue("data:" + JSON.stringify(data) +  "\n\n");
}