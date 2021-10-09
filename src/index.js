const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((x) => x.username === username);

  if (!user) {
    return response.status(404).json({ error: "User not found!" });
  }

  request.user = user;

  return next();
}

function updateTodo(user, todoData) {
  const { todos } = user;
  const todoIndex = todos.findIndex((t) => t.id === todoData.id);

  if (todoIndex === -1) {
    return null;
  }

  todos[todoIndex] = {
    ...todos[todoIndex],
    ...todoData,
  };

  return todos[todoIndex];
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const userFound = users.find((u) => u.username === username);
  if (userFound) {
    return response.status(400).json({ error: "User already exists" });
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.status(200).json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  user.todos.push(newTodo);

  return response.status(201).json(newTodo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;
  const { id } = request.params;

  if (!id) {
    return response.status(400).json({ error: "Invalid ID!" });
  }

  const todo = updateTodo(user, { id, title, deadline });

  if (!todo) {
    return response.status(404).json({ error: "Todo not found!" });
  }

  return response.status(200).json(todo);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  if (!id) {
    return response.status(400).json({ error: "Invalid ID!" });
  }

  const todo = updateTodo(user, { id, done: true });

  if (!todo) {
    return response.status(404).json({ error: "Todo not found!" });
  }

  return response.status(200).json(todo);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const todoFound = user.todos.find((t) => t.id === id);

  if (!todoFound) {
    return response.status(404).json({ error: "Todo not found!" });
  }

  user.todos.splice(todoFound, 1);

  return response.status(204).send();
});

module.exports = app;
