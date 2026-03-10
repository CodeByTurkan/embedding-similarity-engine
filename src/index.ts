import OpenAI from "openai";

const client = new OpenAI();

type RoleProps = {
  role: "user" | "assistant" | "system";
  content: string;
};

function getTimeInBaku() {
  return new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Baku" });
}

function getOrderStatus(orderId: string) { 
  console.log(`Getting order status for order ${orderId}`);
  const orderAsNumber = parseInt(orderId);
  if (orderAsNumber % 2 == 0) {
    return "Order is pending";
  } else {
    return "Order is shipped";
  }
}

async function callOpenAIWithTools() {
  const context: RoleProps[] = [
    {
      role: "system",
      content:
        "You are a helpful assistant who gives information about the time of day and order status.",
    },
    {
      role: "user",
      content: "What is the status of order 123?",
    },
  ];

  const tools = [
    {
      type: "function" as const,
      name: "getTimeInBaku",
      description: "Get the time in the current timezone",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      strict: true,
    },
    {
      type: "function" as const,
      name: "getOrderStatus",
      description: "Get the status of an order by order ID",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "The ID of the order" },
        },
        required: ["orderId"],
        additionalProperties: false,
      },
      strict: true,
    },
  ];

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: context,
    tools,
    tool_choice: "auto",
  });

  const toolCall = response.output.find(
    (item) => item.type === "function_call" && "name" in item
  ) as { type: "function_call"; name: string; call_id: string; arguments: string } | undefined;

  if (toolCall) {
    let toolResponse: string;

    if (toolCall.name === "getTimeInBaku") {
      toolResponse = getTimeInBaku();
    } else if (toolCall.name === "getOrderStatus") {
      const parsedArguments = JSON.parse(toolCall.arguments || "{}");
      toolResponse = getOrderStatus(parsedArguments.orderId);
    } else {
      toolResponse = "Unknown tool";
    }

    const nextInput = [
      ...context,
      ...response.output,
      {
        type: "function_call_output" as const,
        call_id: toolCall.call_id,
        output: toolResponse,
      },
    ];

    const nextResponse = await client.responses.create({
      model: "gpt-4.1-mini",
      input: nextInput,
      tools,
      tool_choice: "auto",
    });
    console.log(nextResponse.output_text);
  } else {
    console.log(response.output_text);
  }
}

callOpenAIWithTools();
