import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";

const geoSchema = new Schema({ lat: Number, lng: Number }, { _id: false });

const venueSchema = new Schema({
  name: { type: String, required: true, trim: true },
  address: String,
  city: { type: String, index: true },
  capacity: Number,
  geo: geoSchema,
});

applyBasePlugin(venueSchema, { tenant: true });
venueSchema.index({ projectId: 1, city: 1 });

export type VenueDoc = InferSchemaType<typeof venueSchema>;
export const Venue = model("Venue", venueSchema, "venues");
