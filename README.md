<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

# Orders Microservice

1. Clonar el repositorio
2. Instalar dependencias
3. Crear un archivo `.env` basado en el `env.templete`
4. Levantar el servidor de NATS
```
docker run -d --name nats-serve -p 4222:4222 -p 8222:8222 nats
```
5. levantar contenedor de doker con postgres
```
docker compose -d
```