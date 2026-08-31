/**
 * .env ve .env.local dosyalarini birlikte yukler.
 *
 * dotenv/config tek basina yalnizca .env okur; sirlar ise .env.local'de
 * duruyor. Ikisini birden yuklemek gerekiyor, yoksa script "kimlik tanimli
 * degil" deyip duruyor ve hata kodda saniliyor.
 */
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname, quiet: true });
config({ path: new URL("../.env.local", import.meta.url).pathname, override: true, quiet: true });
