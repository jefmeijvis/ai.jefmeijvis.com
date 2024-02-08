import {PRIVATE_CONTAINER_BASE_URL} from '$env/static/private'
const base_url : string = PRIVATE_CONTAINER_BASE_URL + '/api/pull'
let headers = {'content-type': 'text/event-stream'}
let ac = new AbortController();

export async function GET({url}) 
{
    // Get request details
    let model = url.searchParams.get('model') ?? "";

    // Get request init and body
    let body : any = getBody(model);
    let requestInit = getRequestInit(body,ac.signal);
    console.log("Received request for model " + model);

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
                        let obj : any = {};
                        try
                        {
                            obj = JSON.parse(reply);

                        }
                        catch(e)
                        {
                            console.dir(e);
                            console.dir(reply)
                        }

                        let result= 
                        {
                            status : obj.status,
                            digest : obj.digest,
                            total : obj.total,
                            completed : obj.completed
                        }

                        sendData(controller,result);
                        return reader.read().then(pump);
                    });
                });
            },
            cancel() 
            {
                if(!ac.signal.aborted)
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

function getBody(model : string)
{
    return {
        'model' : model,
    }
}

function sendData(ctr : ReadableStreamDefaultController, data : any)
{
    ctr.enqueue("data:" + JSON.stringify(data) +  "\n\n");
}