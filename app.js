const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;
let trueOrFalseCondition = "";
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const hasStatusProperty = (requestQuery) => {
  if (
    requestQuery.status !== "TO DO" ||
    requestQuery.status !== "IN PROGRESS" ||
    requestQuery.status !== "DONE"
  ) {
    trueOrFalseCondition = false;
    return trueOrFalseCondition;
  } else {
    return requestQuery.status !== undefined;
  }
};

const hasPriorityProperty = (requestQuery) => {
  if (
    requestQuery.priority !== "HIGH" ||
    requestQuery.priority !== "MEDIUM" ||
    requestQuery.priority !== "LOW"
  ) {
    trueOrFalseCondition = false;
    return trueOrFalseCondition;
  } else {
    return requestQuery.priority !== undefined;
  }
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  if (
    (requestQuery.status !== "TO DO" ||
      requestQuery.status !== "IN PROGRESS" ||
      requestQuery.status !== "DONE") &&
    (requestQuery.priority !== "HIGH" ||
      requestQuery.priority !== "MEDIUM" ||
      requestQuery.priority !== "LOW")
  ) {
    trueOrFalseCondition = false;
    return trueOrFalseCondition;
  } else {
    return (
      requestQuery.priority !== undefined && requestQuery.status !== undefined
    );
  }
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  if (
    (requestQuery.category !== "WORK" ||
      requestQuery.category !== "HOME" ||
      requestQuery.category !== "LEARNING") &&
    (requestQuery.status !== "TO DO" ||
      requestQuery.status !== "IN PROGRESS" ||
      requestQuery.status !== "DONE")
  ) {
    trueOrFalseCondition = false;
    return trueOrFalseCondition;
  } else {
    return (
      requestQuery.category !== undefined && requestQuery.status !== undefined
    );
  }
};

const hasCategoryProperties = (requestQuery) => {
  if (
    requestQuery.category !== "WORK" ||
    requestQuery.category !== "HOME" ||
    requestQuery.category !== "LEARNING"
  ) {
    trueOrFalseCondition = false;
    return trueOrFalseCondition;
  } else {
    return requestQuery.category !== undefined;
  }
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  if (
    (requestQuery.category !== "WORK" ||
      requestQuery.category !== "HOME" ||
      requestQuery.category !== "LEARNING") &&
    (requestQuery.priority !== "HIGH" ||
      requestQuery.priority !== "MEDIUM" ||
      requestQuery.priority !== "LOW")
  ) {
    trueOrFalseCondition = false;
    return trueOrFalseCondition;
  } else {
    return (
      requestQuery.category !== undefined && requestQuery.priority !== undefined
    );
  }
};

app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority, category, dueDate } = request.query;
  let data = null;
  let getTodosQuery = "";
  let isValid = require("date-fns/isValid");

  switch (true) {
    case hasStatusProperty(request.query):
      getTodosQuery = `SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;

    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;

    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;

    case hasCategoryAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}'
        AND status = '${status}';`;
      break;

    case hasCategoryProperties(request.query):
      getTodosQuery = `
          SELECT * FROM
          todo
          WHERE
          todo LIKE '%${search_q}%'
          AND category = '${category}';`;
      break;

    case hasCategoryAndPriorityProperties(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND category = '${category}'
            AND priority = '${priority}';`;
      break;

    default:
      getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%';`;
      break;
  }
  if (getTodosQuery !== undefined) {
    data = await db.all(getTodosQuery);
    response.send(data);
  } else {
    switch (false) {
      case hasStatusProperty(request.query):
        response.status(400);
        response.send("Invalid Todo Status");
        break;
      case hasPriorityProperty(request.query):
        response.status(400);
        response.send("Invalid Todo Priority");
        break;
      case hasPriorityAndStatusProperties(request.query):
        response.status(400);
        response.send("Invalid Todo Priority and Status");
        break;
      case hasCategoryAndStatusProperties(request.query):
        response.status(400);
        response.send("Invalid Todo Category and Status");
        break;
      case hasCategoryProperties(request.query):
        response.status(400);
        response.send("Invalid Todo Category");
        break;
      case hasCategoryAndPriorityProperties(request.query):
        response.status(400);
        response.send("Invalid Todo Category and Priority");
        break;
    }
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoIdQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await db.get(getTodoIdQuery);
  response.send(todo);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const newDate = format(date, "yyyy-MM-dd");

  const agendaQuery = `
    SELECT * FROM
    todo
    WHERE 
    due_date = '${newDate};`;
  const dateDetails = await db.all(agendaQuery);
  response.send(dateDetails);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postTodoQuery = `
    INSERT INTO
        todo (id, todo, priority, status, category, due_date)
    VALUES
        (${id}, '${todo}', '${priority}', '${status}', '${category}','${newDate}');`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category Updated";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date Updated";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category = '${category}',
      due_date = '${dueDate}'
    WHERE
      id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
