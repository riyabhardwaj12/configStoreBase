import React, { useRef, useState, useEffect } from "react";
import Form from "react-bootstrap/Form";
import { ConfigType } from "../types/config";
import { s3Upload } from "../lib/awsLib";
import { onError } from "../lib/errorLib";
import Stack from "react-bootstrap/Stack";
import { API, Storage } from "aws-amplify";
import LoaderButton from "../components/LoaderButton";
import { useParams, useNavigate } from "react-router-dom";
import "./Config.css";
import appConfig from "../appConfig";

export default function Config() {
  const file = useRef<null | File>(null);
  const { id } = useParams();
  const nav = useNavigate();
  const [config, setConfig] = useState<null | ConfigType>(null);
  const [configName, setConfigName] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRollbackInProgress, setIsRollbackInProgress] = useState(false);

  useEffect(() => {
    function loadConfig() {
      return API.get("config", `/config/${id}`, {});
    }

    async function onLoad() {
      try {
        const config = await loadConfig();
        const { configName, content, attachment } = config;

        if (attachment) {
          config.attachmentURL = await Storage.vault.get(attachment);
        }

        setConfigName(configName);
        setContent(content);
        setConfig(config);
      } catch (e) {
        onError(e);
      }
    }

    onLoad();
  }, [id]);

  function validateForm() {
    return content.length > 0;
  }

  function formatFilename(str: string) {
    return str.replace(/^\w+-/, "");
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.currentTarget.files === null) return;
    file.current = event.currentTarget.files[0];
  }

  function saveConfig(config: ConfigType) {
    return API.put("config", `/config/${id}`, {
      body: config,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    let attachment;

    event.preventDefault();

    if (file.current && file.current.size > appConfig.MAX_ATTACHMENT_SIZE) {
      alert(
        `Please pick a file smaller than ${
          appConfig.MAX_ATTACHMENT_SIZE / 1000000
        } MB.`
      );
      return;
    }

    setIsLoading(true);

    try {
      if (file.current) {
        attachment = await s3Upload(file.current);
      } else if (config && config.attachment) {
        attachment = config.attachment;
      }

      await saveConfig({
        configName: configName,
        content: content,
        attachment: attachment,
      });
      nav("/");
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  function deleteConfig() {
    return API.del("config", `/config/${id}`, {});
  }

  async function handleDelete(event: React.FormEvent<HTMLModElement>) {
    event.preventDefault();

    const confirmed = window.confirm(
      "Are you sure you want to delete this config?"
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteConfig();
      nav("/");
    } catch (e) {
      onError(e);
      setIsDeleting(false);
    }
  }

  function rollbackConfig() {
    return API.put("config", `/config/${id}/rollback`, {});
  }

  async function handleRollback() {
    const confirmed = window.confirm(
      "Are you sure you want to rollback?"
    );

    if (!confirmed) {
      return;
    }

    setIsRollbackInProgress(true);

    try {
      await rollbackConfig();
      nav("/");
    } catch (e) {
      onError(e);
      setIsRollbackInProgress(false);
    }
  }

  return (
    <div className="Config">
      {config && (
        <Form onSubmit={handleSubmit}>
          <Stack gap={3}>
            <Form.Group controlId="configName">
              <Form.Control
                size="lg"
                as="textarea"
                value={configName}
                disabled
                style={{
                  resize: 'none',
                }}
                onChange={(e) => setConfigName(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="content">
              <Form.Control
                size="lg"
                as="textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mt-2" controlId="file">
              <Form.Label>Attachment</Form.Label>
              {config.attachment && (
                <p>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={config.attachmentURL}
                  >
                    {formatFilename(config.attachment)}
                  </a>
                </p>
              )}
              <Form.Control onChange={handleFileChange} type="file" />
            </Form.Group>
            <Stack gap={1}>
              <LoaderButton
                size="lg"
                type="submit"
                isLoading={isLoading}
                disabled={!validateForm()}
                variant="success" 
              >
                Save
              </LoaderButton>
              <LoaderButton
                size="lg"
                variant="danger"
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                Delete
              </LoaderButton>
              <LoaderButton
                size="lg"
                variant="primary" 
                onClick={handleRollback}
                isLoading={isRollbackInProgress}
              >
                Rollback
              </LoaderButton>
            </Stack>
          </Stack>
        </Form>
      )}
    </div>
  );
}