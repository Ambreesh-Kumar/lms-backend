import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },
    avatar: { type: String },
    avatarPublicId: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    tokenVersion: {
      type: Number,
      required: true,
      default: 0,
    }, // will be used for logout from all devices
  },
  { timestamps: true }
);

// hash password before save user data in database

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// hepler funtion to compare password
userSchema.methods.comparePassword = async function (userPassword) {
  return bcrypt.compare(userPassword, this.password);
};

export const User = mongoose.model("user", userSchema);
