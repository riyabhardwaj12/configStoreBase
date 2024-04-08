import { useState, useEffect } from "react";
import { API } from "aws-amplify";
import { ConfigType } from "../types/config";
import { onError } from "../lib/errorLib";
import { BsPencilSquare } from "react-icons/bs";
import ListGroup from "react-bootstrap/ListGroup";
import { LinkContainer } from "react-router-bootstrap";
import { useAppContext } from "../lib/contextLib";
import "./Home.css";

export default function Home() {
  const [config, setConfig] = useState<Array<ConfigType>>([]);
  const { isAuthenticated } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function onLoad() {
      if (!isAuthenticated) {
        return;
      }

      try {
        const config = await loadConfig();
        setConfig(config);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, [isAuthenticated]);

  function loadConfig() {
    return API.get("config", "/config", {});
  }

  function formatDate(str: undefined | string) {
    return !str ? "" : new Date(str).toLocaleString();
  }

  function renderConfigList(config: ConfigType[]) {
    return (
      <>
        <LinkContainer to="/config/new">
          <ListGroup.Item action className="py-3 text-nowrap text-truncate">
            <BsPencilSquare size={17} />
            <span className="ms-2 fw-bold">Create a new config</span>
          </ListGroup.Item>
        </LinkContainer>

        {config.map(({ configId, configName, createdAt }) => (
          <LinkContainer key={configId} to={`/config/${configId}`}>
            <ListGroup.Item action className="text-nowrap text-truncate">
              <span className="fw-bold"> Name : {configName}, Id : {configId}</span>
              <br />
              <span className="text-muted">
                Created: {formatDate(createdAt)}
              </span>
            </ListGroup.Item>
          </LinkContainer>
        ))}
      </>
    );
  }

  function renderLander() {
    return (
      <div className="lander">
        <h1>Hello</h1>
        <p className="text-muted">A simple config store app</p>
      </div>
    );
  }

  function renderConfig() {
    return (
      <div className="config">
        <h2 className="pb-3 mt-4 mb-3 border-bottom">Your Configs</h2>
        <ListGroup>{!isLoading && renderConfigList(config)}</ListGroup>
      </div>
    );
  }

  return (
    <div className="Home">
      {isAuthenticated ? renderConfig() : renderLander()}
    </div>
  );
}
