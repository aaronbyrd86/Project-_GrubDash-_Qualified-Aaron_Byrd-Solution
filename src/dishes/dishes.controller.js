const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function idExists(req, res, next) {
  const dishId = req.params.id;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${req.params.id}`,
  });
}

function bodyHasNameProperty(req, res, next) {
  const { data: { name } = {} } = req.body;

  if (name) {
    return next(); // Call `next()` without an error message if the result exists
  }

  next({ message: "Dish must include a name", status: 400 });
}

function bodyHasDescriptionProperty(req, res, next) {
  const { data: { description } = {} } = req.body;

  if (description) {
    return next(); // Call `next()` without an error message if the result exists
  }

  next({ message: "Dish must include a description", status: 400 });
}

function bodyHasImageUrlProperty(req, res, next) {
  const { data: { image_url } = {} } = req.body;

  if (image_url) {
    return next(); // Call `next()` without an error message if the result exists
  }

  next({ message: "Dish must include a image_url", status: 400 });
}

function validatePrice(req, res, next) {
  const { data: { price } = {} } = req.body;

  if (!price)
    return next({ message: "Dish must include a price.", status: 400 });

  if (!Number.isInteger(price))
    return next({
      message: "Dish must have a price that is an integer greater than 0",
      status: 400,
    });

  if (price > 0) {
    return next(); // Call `next()` without an error message if the result exists
  }

  next({
    message: "Dish must have a price that is an integer greater than 0",
    status: 400,
  });
}

function list(_req, res) {
  res.json({ data: dishes });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function create(req, res, next) {
  const {
    data: { name, description, price, image_url },
  } = req.body;
  const newDish = {
    name,
    description,
    price,
    image_url,
    id: nextId(),
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function update(req, res, next) {
  const {
    data: { name, description, price, image_url, id },
  } = req.body;
  const dishId = req.params.id;
  const foundDishIndex = dishes.findIndex((dish) => dish.id === dishId);


  const updatedDish = {
    ...res.locals.dish,
    name,
    description,
    price,
    image_url,
  };

  if (id) {
    console.log(id)
    console.log(res.locals.dish.id)
    if (id !== res.locals.dish.id)
      return next({
        message: `Dish id does not match route id. Dish: ${id}, Route: ${res.locals.dish.id}`,
        status: 400,
      });
  }

  dishes[foundDishIndex] = updatedDish;

  res.json({ data: updatedDish });
}

module.exports = {
  list,
  read: [idExists, read],
  create: [
    bodyHasDescriptionProperty,
    bodyHasNameProperty,
    bodyHasImageUrlProperty,
    validatePrice,
    create,
  ],
  update: [
    idExists,
    bodyHasDescriptionProperty,
    bodyHasNameProperty,
    bodyHasImageUrlProperty,
    validatePrice,
    update,
  ],
};
