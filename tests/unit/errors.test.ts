import { describe, it, expect } from "vitest";
import {
  BundlerError,
  EntryNotFoundError,
  ParseError,
  ResolveError,
  CircularDependencyError,
  PluginError,
  TransformError,
  OutputError,
  ConfigError,
} from "../../src/errors.js";

describe("BundlerError", () => {
  it("should create error with message and code", () => {
    const error = new BundlerError("test message", "TEST_CODE");
    expect(error.message).toBe("test message");
    expect(error.code).toBe("TEST_CODE");
    expect(error.name).toBe("BundlerError");
  });

  it("should create error with optional id", () => {
    const error = new BundlerError("test message", "TEST_CODE", "test-id");
    expect(error.id).toBe("test-id");
  });

  it("should be instanceof Error", () => {
    const error = new BundlerError("test", "CODE");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("EntryNotFoundError", () => {
  it("should create error with path", () => {
    const error = new EntryNotFoundError("/path/to/entry.js");
    expect(error.message).toContain("/path/to/entry.js");
    expect(error.code).toBe("ENTRY_NOT_FOUND");
    expect(error.name).toBe("EntryNotFoundError");
    expect(error.id).toBe("/path/to/entry.js");
  });

  it("should be instanceof BundlerError", () => {
    const error = new EntryNotFoundError("/test");
    expect(error).toBeInstanceOf(BundlerError);
  });
});

describe("ParseError", () => {
  it("should create error with message and id", () => {
    const error = new ParseError("Unexpected token", "module.js");
    expect(error.message).toContain("Parse error");
    expect(error.message).toContain("Unexpected token");
    expect(error.code).toBe("PARSE_ERROR");
    expect(error.name).toBe("ParseError");
    expect(error.id).toBe("module.js");
  });
});

describe("ResolveError", () => {
  it("should create error with import and from paths", () => {
    const error = new ResolveError("./utils", "/src/index.js");
    expect(error.message).toContain("./utils");
    expect(error.message).toContain("/src/index.js");
    expect(error.code).toBe("RESOLVE_ERROR");
    expect(error.name).toBe("ResolveError");
    expect(error.id).toBe("./utils");
  });
});

describe("CircularDependencyError", () => {
  it("should create error with cycle", () => {
    const cycle = ["a.js", "b.js", "c.js", "a.js"];
    const error = new CircularDependencyError(cycle);
    expect(error.message).toContain("Circular dependency");
    expect(error.message).toContain("a.js → b.js → c.js → a.js");
    expect(error.code).toBe("CIRCULAR_DEP");
    expect(error.name).toBe("CircularDependencyError");
    expect(error.cycle).toEqual(cycle);
  });

  it("should store cycle array", () => {
    const cycle = ["x.js", "y.js"];
    const error = new CircularDependencyError(cycle);
    expect(error.cycle).toHaveLength(2);
    expect(error.cycle[0]).toBe("x.js");
  });
});

describe("PluginError", () => {
  it("should create error with plugin name and message", () => {
    const error = new PluginError("my-plugin", "Something went wrong");
    expect(error.message).toContain("my-plugin");
    expect(error.message).toContain("Something went wrong");
    expect(error.code).toBe("PLUGIN_ERROR");
    expect(error.name).toBe("PluginError");
  });
});

describe("TransformError", () => {
  it("should create error with message and id", () => {
    const error = new TransformError("Transform failed", "file.ts");
    expect(error.message).toContain("Transform error");
    expect(error.message).toContain("Transform failed");
    expect(error.code).toBe("TRANSFORM_ERROR");
    expect(error.name).toBe("TransformError");
    expect(error.id).toBe("file.ts");
  });
});

describe("OutputError", () => {
  it("should create error with message", () => {
    const error = new OutputError("Failed to write file");
    expect(error.message).toContain("Output error");
    expect(error.message).toContain("Failed to write file");
    expect(error.code).toBe("OUTPUT_ERROR");
    expect(error.name).toBe("OutputError");
  });

  it("should create error with optional path", () => {
    const error = new OutputError("Failed to write", "/out/file.js");
    expect(error.id).toBe("/out/file.js");
  });
});

describe("ConfigError", () => {
  it("should create error with message", () => {
    const error = new ConfigError("Invalid configuration");
    expect(error.message).toContain("Config error");
    expect(error.message).toContain("Invalid configuration");
    expect(error.code).toBe("CONFIG_ERROR");
    expect(error.name).toBe("ConfigError");
  });
});
