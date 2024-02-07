let interval : number = -1;
let headers = {'content-type': 'text/event-stream'}
let ac = new AbortController();
const base_url : string = "https://ollama--4ghoj32.blueplant-2325db26.westeurope.azurecontainerapps.io/api/generate";

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
                        if(done)
                            return;

                        let reply = new TextDecoder().decode(value);
                        let obj = JSON.parse(reply);


                        let result= 
                        {
                            response : obj.response,
                            done : obj.done,
                            duration : obj.total_duration ?? -1
                        }
                        console.dir(obj);
                        sendData(controller,result);
                        return reader.read().then(pump);
                    });
                });
            },
            cancel() 
            {
                ac.abort()
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