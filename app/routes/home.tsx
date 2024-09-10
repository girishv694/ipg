import {
  LoaderFunction,
  ActionFunction,
  json,
  redirect,
  createCookieSessionStorage,
} from "@remix-run/node";
import { prisma } from "../../app/db.server";
import { Form, useLoaderData, useActionData } from "@remix-run/react";
import axios from "axios";

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  },
});

export const loader: LoaderFunction = async ({ request }) => {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  const userId = session.get("userId");
  const username = session.get("userName");

  if (!userId || !username) {
    return redirect("/login");
  }


  try {
    const userCities = await prisma.city.findMany({
      where: { userId },
    });


    let weatherDetails: any[] = []
    let key = "211313fd2cd74372b4852626240809";
    for (let item of userCities) {
      let url = `http://api.weatherapi.com/v1/current.json?key=${key}&q=${item?.name}`;
      const response = await axios.get(url);
      if (response) {
        weatherDetails.push(response.data)
      }

    }
    return json({
      weatherData: weatherDetails,
      userCities,
      username
    });
  } catch (error) {
    return json({ error: 'Unable to fetch weather data' }, { status: 500 });
  }

};

export const action: ActionFunction = async ({ request }) => {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  const userId = session.get("userId");

  if (!userId) {
    return redirect("/login");
  }
  const formData = await request.formData();
  const cityId = formData.get("cityId");

  if (cityId) {

    await prisma.city.delete({
      where: { id: Number(cityId) },
    });
    return redirect("/home");
  }


  const cityName = formData.get("cityName");

  if (typeof cityName !== "string" || cityName.trim() === "") {
    return json({ error: "City name is required" }, { status: 400 });
  }

  const userCities = await prisma.city.findMany({
    where: { userId },
  });

  if (userCities.length >= 5) {
    return json({ error: "You can only have up to 5 cities" }, { status: 400 });
  }

  await prisma.city.create({
    data: {
      name: cityName,
      userId,
    },
  });

  return redirect("/home");
};

const Home = () => {
  const { username, userCities, weatherData }: any = useLoaderData();
  const actionData: any = useActionData();

  return (
    <div className="w-full">
      <header className="h-16 bg-blue-800 text-white flex justify-center items-center">
        <h1>Welcome to the weather app {username}</h1>
      </header>

      <div className="w-10/12 m-auto flex gap-10 py-10">
        <div className="w-1/3">
          <h2 className="text-blue-600 text-xl font-bold">Your Favourite Cities</h2>
          <ul>
            {userCities.map((city: any) => (
              <div className="flex  justify-between" key={city.id}>
                <li className="p-3" key={city.id}>{city.name}</li>
                <Form method="post" className="flex items-center">
                  <input type="hidden" name="cityId" value={city.id} />
                  <button type="submit" className="ml-2 bg-red-500 text-white p-2 rounded">
                    X
                  </button>
                </Form>
              </div>

            ))}
          </ul>

          <div className="mt-10">
            <h2 className="text-blue-600 text-xl font-bold">Add a New City</h2>
            <Form method="post" className="flex flex-col gap-4">
              <input
                type="text"
                name="cityName"
                placeholder="City Name"
                className="p-3 border border-gray-300 rounded"
              />
              <button type="submit" className="bg-blue-500 text-white p-3 rounded">
                Add City
              </button>
            </Form>

            {actionData?.error && <p className="text-red-500">{actionData.error}</p>}

            {userCities.length >= 5 && (
              <p className="text-red-500">You can only add up to 5 cities.</p>
            )}
          </div>
        </div>

        <div className="">
          <h2 className="text-blue-600 text-xl font-bold">Weather Information</h2>
          <div className="grid grid-cols-3 gap-10">
            {
              weatherData.map((item: any) => (
                <div key={item?.location?.name} className='shadow-2xl  mt-6 p-6 rounded-lg'>
                  <p>City: {item?.location?.name}</p>
                  <p>Temperature: {item?.current?.temp_c}°C</p>
                  <p>Condition: {item?.current?.condition?.text}</p>
                  <p>Humidity: {item?.current?.humidity}%</p>
                  <p>Wind Speed: {item?.current?.wind_kph} kph</p>
                  <img src={`http:${item?.current?.condition?.icon}`} alt="" />
                </div>
              ))
            }
          </div>

        </div>
      </div>

    </div>
  );
};

export default Home;
