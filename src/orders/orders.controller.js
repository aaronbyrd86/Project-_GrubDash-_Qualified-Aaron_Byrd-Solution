const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function idExists(req, res, next) {
  const orderId = req.params.id;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${req.params.id}`,
  });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;

    if (data[propertyName]) {
      return next();
    }

    if (propertyName === "status")
      return next({
        status: 400,
        message:
          "Order must have a status of pending, preparing, out-for-delivery, delivered",
      });

    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}

function validateDishes(req, res, next) {
  const {
    data: { dishes },
  } = req.body;

  //validate array
  if (!dishes)
    return next({ status: 400, message: `Order must include a dish` });
  if (dishes.length === 0 || !Array.isArray(dishes))
    return next({
      status: 400,
      message: `Order must include at least one dish`,
    });

  //validate each dish
  dishes.forEach((dish, index) => {
    if (
      !dish.quantity ||
      dish.quantity <= 0 ||
      !Number.isInteger(dish.quantity)
    )
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
  });

  next();
}

function list(req, res) {
  res.json({ data: orders });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function create(req, res, next) {
  const {
    data: { deliverTo, dishes, quantity, mobileNumber, status },
  } = req.body;
  const newOrder = {
    deliverTo,
    dishes,
    quantity,
    mobileNumber,
    status,
    id: nextId(),
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function update(req, res, next) {
  const {
    data: { deliverTo, dishes, quantity, mobileNumber, status, id },
  } = req.body;

  const orderId = req.params.id;
  const foundOrder = orders.findIndex((order) => order.id === orderId);

  if (res.locals.order.status === "delivered")
    return next({
      message: "A delivered order cannot be changed",
      status: 400,
    });

  if(status !=="pending" && status !=="preparing" && status !=="out-for-delivery") 
  return next({
    message: "Invalid status",
    status: 400,
  });  

  if (id) {
    if (id !== res.locals.order.id)
      return next({
        message: `Order id does not match route id. Dish: ${id}, Route: ${res.locals.order.id}`,
        status: 400,
      });
  }

  const updatedOrder = {
    ...res.locals.order,
    deliverTo,
    dishes,
    quantity,
    mobileNumber,
    status,
  };

  orders[foundOrder] = updatedOrder;

  res.json({ data: updatedOrder });
}

function destroy(req, res, next) {
  const { id } = req.params;

  const index = orders.findIndex((order) => order.id === id);

  // `splice()` returns an array of the deleted elements, even if it is one element
  if (res.locals.order.status !== "pending")
    return next({
      message: `An order cannot be deleted unless it is pending.`,
      status: 400,
    });

  const deletedOrder = orders.splice(index, 1);

  res.sendStatus(204);
}

module.exports = {
  list,
  read: [idExists, read],
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    validateDishes,
    create,
  ],
  update: [
    idExists,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("status"),
    validateDishes,
    update,
  ],
  delete: [idExists, destroy]
};
