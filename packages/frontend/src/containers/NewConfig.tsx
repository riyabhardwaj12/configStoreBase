import React, { useRef, useState } from "react";
import { API } from "aws-amplify";
import Form from "react-bootstrap/Form";
import { ConfigType } from "../types/config";
import { s3Upload } from "../lib/awsLib";
import { onError } from "../lib/errorLib";
import { useNavigate } from "react-router-dom";
import LoaderButton from "../components/LoaderButton";
import config from "../appConfig";
import "./NewConfig.css";

export default function NewConfig() {
  const file = useRef<null | File>(null);
  const nav = useNavigate();
  const [configName, setConfigName] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function validateForm() {
    return content.length > 0;
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.currentTarget.files === null) return;
    file.current = event.currentTarget.files[0];
  }

  function createConfig(config: ConfigType) {
    return API.post("config", "/config", {
      body: config,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (file.current && file.current.size > config.MAX_ATTACHMENT_SIZE) {
      alert(
        `Please pick a file smaller than ${
          config.MAX_ATTACHMENT_SIZE / 1000000
        } MB.`
      );
      return;
    }

    setIsLoading(true);

    try {
      const attachment = file.current
        ? await s3Upload(file.current)
        : undefined;

      await createConfig({configName, content, attachment });
      nav("/");
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  return (
    <div className="NewConfig">
      <Form onSubmit={handleSubmit}>
      <Form.Group controlId="configName">
      <Form.Label>Enter Config Name</Form.Label>
          <Form.Control
            value={configName}
            as="textarea"
            onChange={(e) => setConfigName(e.target.value)}
            style={{
              resize: 'none',
            }}
          />
        </Form.Group>
        <Form.Group controlId="content">

      <Form.Label>Enter Config Value</Form.Label>
          <Form.Control
            value={content}
            as="textarea"
            onChange={(e) => setContent(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mt-2" controlId="file">
          <Form.Label>Attachment</Form.Label>
          <Form.Control onChange={handleFileChange} type="file" />
        </Form.Group>
        <LoaderButton
          size="lg"
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={!validateForm()}
        >
          Create
        </LoaderButton>
      </Form>
    </div>
  );
}
